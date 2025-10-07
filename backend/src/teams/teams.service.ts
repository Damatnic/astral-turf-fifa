import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as crypto from 'crypto';
import { Team } from './entities/team.entity';
import { TeamMember, TeamRole } from './entities/team-member.entity';
import {
  TeamInvitation,
  InvitationStatus,
  InvitationRole,
} from './entities/team-invitation.entity';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';

@Injectable()
export class TeamsService {
  constructor(
    @InjectRepository(Team)
    private teamsRepository: Repository<Team>,
    @InjectRepository(TeamMember)
    private teamMembersRepository: Repository<TeamMember>,
    @InjectRepository(TeamInvitation)
    private teamInvitationsRepository: Repository<TeamInvitation>
  ) {}

  // Create a new team
  async create(createTeamDto: CreateTeamDto, ownerId: number): Promise<Team> {
    const team = this.teamsRepository.create({
      ...createTeamDto,
      ownerId,
    });

    const savedTeam = await this.teamsRepository.save(team);

    // Add owner as team member
    const ownerMember = this.teamMembersRepository.create({
      teamId: savedTeam.id,
      userId: ownerId,
      role: TeamRole.OWNER,
    });

    await this.teamMembersRepository.save(ownerMember);

    return savedTeam;
  }

  // Find all teams
  async findAll(): Promise<Team[]> {
    return this.teamsRepository.find({
      relations: ['owner', 'members', 'members.user'],
    });
  }

  // Find teams by owner
  async findByOwner(ownerId: number): Promise<Team[]> {
    return this.teamsRepository.find({
      where: { ownerId },
      relations: ['members', 'members.user'],
    });
  }

  // Find teams where user is a member
  async findByMember(userId: number): Promise<Team[]> {
    const members = await this.teamMembersRepository.find({
      where: { userId },
      relations: ['team', 'team.owner', 'team.members', 'team.members.user'],
    });

    return members.map(member => member.team);
  }

  // Find one team by id
  async findOne(id: number): Promise<Team> {
    const team = await this.teamsRepository.findOne({
      where: { id },
      relations: ['owner', 'members', 'members.user', 'invitations'],
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  // Update a team
  async update(id: number, updateTeamDto: UpdateTeamDto, userId: number): Promise<Team> {
    const team = await this.findOne(id);

    // Check if user is owner or admin
    if (team.ownerId !== userId) {
      throw new ForbiddenException('Only the team owner can update the team');
    }

    Object.assign(team, updateTeamDto);
    return this.teamsRepository.save(team);
  }

  // Delete a team
  async remove(id: number, userId: number): Promise<void> {
    const team = await this.findOne(id);

    // Check if user is owner
    if (team.ownerId !== userId) {
      throw new ForbiddenException('Only the team owner can delete the team');
    }

    await this.teamsRepository.remove(team);
  }

  // Add a team member directly (no invitation)
  async addMember(
    teamId: number,
    addMemberDto: AddTeamMemberDto,
    requesterId: number
  ): Promise<TeamMember> {
    const team = await this.findOne(teamId);

    // Check if requester is owner or coach
    const requesterMember = await this.teamMembersRepository.findOne({
      where: { teamId, userId: requesterId },
    });

    if (
      !requesterMember ||
      (requesterMember.role !== TeamRole.OWNER && requesterMember.role !== TeamRole.COACH)
    ) {
      throw new ForbiddenException('Only team owners and coaches can add members');
    }

    // Check if user is already a member
    const existingMember = await this.teamMembersRepository.findOne({
      where: { teamId, userId: addMemberDto.userId },
    });

    if (existingMember) {
      throw new ConflictException('User is already a member of this team');
    }

    // Check team capacity
    const memberCount = await this.teamMembersRepository.count({
      where: { teamId },
    });

    if (memberCount >= team.maxPlayers) {
      throw new BadRequestException('Team has reached maximum capacity');
    }

    // Create member
    const member = this.teamMembersRepository.create({
      teamId,
      userId: addMemberDto.userId,
      role: addMemberDto.role,
      jerseyNumber: addMemberDto.jerseyNumber,
      position: addMemberDto.position,
    });

    return this.teamMembersRepository.save(member);
  }

  // Remove a team member
  async removeMember(teamId: number, userId: number, requesterId: number): Promise<void> {
    const team = await this.findOne(teamId);

    // Check if requester is owner or coach
    const requesterMember = await this.teamMembersRepository.findOne({
      where: { teamId, userId: requesterId },
    });

    if (
      !requesterMember ||
      (requesterMember.role !== TeamRole.OWNER && requesterMember.role !== TeamRole.COACH)
    ) {
      throw new ForbiddenException('Only team owners and coaches can remove members');
    }

    // Don't allow removing the owner
    if (userId === team.ownerId) {
      throw new ForbiddenException('Cannot remove the team owner');
    }

    const member = await this.teamMembersRepository.findOne({
      where: { teamId, userId },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this team');
    }

    await this.teamMembersRepository.remove(member);
  }

  // Update member details (jersey number, position)
  async updateMember(
    teamId: number,
    userId: number,
    updateData: { jerseyNumber?: number; position?: string },
    requesterId: number
  ): Promise<TeamMember> {
    // Check if requester is owner or coach
    const requesterMember = await this.teamMembersRepository.findOne({
      where: { teamId, userId: requesterId },
    });

    if (
      !requesterMember ||
      (requesterMember.role !== TeamRole.OWNER && requesterMember.role !== TeamRole.COACH)
    ) {
      throw new ForbiddenException('Only team owners and coaches can update member details');
    }

    const member = await this.teamMembersRepository.findOne({
      where: { teamId, userId },
    });

    if (!member) {
      throw new NotFoundException('Member not found in this team');
    }

    Object.assign(member, updateData);
    return this.teamMembersRepository.save(member);
  }

  // Send team invitation
  async inviteMember(
    teamId: number,
    inviteDto: InviteTeamMemberDto,
    inviterId: number
  ): Promise<TeamInvitation> {
    // Verify team exists
    await this.findOne(teamId);

    // Check if inviter is owner or coach
    const inviterMember = await this.teamMembersRepository.findOne({
      where: { teamId, userId: inviterId },
    });

    if (
      !inviterMember ||
      (inviterMember.role !== TeamRole.OWNER && inviterMember.role !== TeamRole.COACH)
    ) {
      throw new ForbiddenException('Only team owners and coaches can invite members');
    }

    // Check for existing pending invitation
    const existingInvitation = await this.teamInvitationsRepository.findOne({
      where: {
        teamId,
        email: inviteDto.email,
        status: InvitationStatus.PENDING,
      },
    });

    if (existingInvitation) {
      throw new ConflictException('A pending invitation already exists for this email');
    }

    // Generate unique token
    const token = crypto.randomBytes(32).toString('hex');

    // Set expiration to 7 days from now
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7);

    const invitation = this.teamInvitationsRepository.create({
      teamId,
      email: inviteDto.email,
      role: inviteDto.role,
      token,
      invitedBy: inviterId,
      expiresAt,
    });

    return this.teamInvitationsRepository.save(invitation);
  }

  // Get team invitations
  async getInvitations(teamId: number, requesterId: number): Promise<TeamInvitation[]> {
    // Check if requester is a member of the team
    const member = await this.teamMembersRepository.findOne({
      where: { teamId, userId: requesterId },
    });

    if (!member) {
      throw new ForbiddenException('You are not a member of this team');
    }

    return this.teamInvitationsRepository.find({
      where: { teamId },
      relations: ['inviter', 'team'],
    });
  }

  // Accept invitation
  async acceptInvitation(token: string, userId: number): Promise<TeamMember> {
    const invitation = await this.teamInvitationsRepository.findOne({
      where: { token },
      relations: ['team'],
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer valid');
    }

    if (new Date() > invitation.expiresAt) {
      invitation.status = InvitationStatus.EXPIRED;
      await this.teamInvitationsRepository.save(invitation);
      throw new BadRequestException('Invitation has expired');
    }

    // Check if user is already a member
    const existingMember = await this.teamMembersRepository.findOne({
      where: { teamId: invitation.teamId, userId },
    });

    if (existingMember) {
      throw new ConflictException('You are already a member of this team');
    }

    // Check team capacity
    const memberCount = await this.teamMembersRepository.count({
      where: { teamId: invitation.teamId },
    });

    if (memberCount >= invitation.team.maxPlayers) {
      throw new BadRequestException('Team has reached maximum capacity');
    }

    // Create member
    const member = this.teamMembersRepository.create({
      teamId: invitation.teamId,
      userId,
      role: invitation.role === InvitationRole.COACH ? TeamRole.COACH : TeamRole.PLAYER,
    });

    const savedMember = await this.teamMembersRepository.save(member);

    // Update invitation status
    invitation.status = InvitationStatus.ACCEPTED;
    await this.teamInvitationsRepository.save(invitation);

    return savedMember;
  }

  // Decline invitation
  async declineInvitation(token: string): Promise<void> {
    const invitation = await this.teamInvitationsRepository.findOne({
      where: { token },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    if (invitation.status !== InvitationStatus.PENDING) {
      throw new BadRequestException('Invitation is no longer valid');
    }

    invitation.status = InvitationStatus.DECLINED;
    await this.teamInvitationsRepository.save(invitation);
  }

  // Cancel invitation (by team owner/coach)
  async cancelInvitation(invitationId: number, requesterId: number): Promise<void> {
    const invitation = await this.teamInvitationsRepository.findOne({
      where: { id: invitationId },
    });

    if (!invitation) {
      throw new NotFoundException('Invitation not found');
    }

    // Check if requester is owner or coach
    const requesterMember = await this.teamMembersRepository.findOne({
      where: { teamId: invitation.teamId, userId: requesterId },
    });

    if (
      !requesterMember ||
      (requesterMember.role !== TeamRole.OWNER && requesterMember.role !== TeamRole.COACH)
    ) {
      throw new ForbiddenException('Only team owners and coaches can cancel invitations');
    }

    await this.teamInvitationsRepository.remove(invitation);
  }

  // Get team members
  async getMembers(teamId: number): Promise<TeamMember[]> {
    await this.findOne(teamId); // Verify team exists

    return this.teamMembersRepository.find({
      where: { teamId },
      relations: ['user'],
    });
  }
}
