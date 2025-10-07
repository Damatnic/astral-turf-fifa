import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { TeamsService } from './teams.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { UpdateTeamDto } from './dto/update-team.dto';
import { AddTeamMemberDto } from './dto/add-team-member.dto';
import { InviteTeamMemberDto } from './dto/invite-team-member.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { UserRole } from '../users/entities/user.entity';

@Controller('teams')
@UseGuards(JwtAuthGuard, RolesGuard)
export class TeamsController {
  constructor(private readonly teamsService: TeamsService) {}

  // Create a new team
  @Post()
  @Roles(UserRole.ADMIN, UserRole.COACH)
  create(@Body() createTeamDto: CreateTeamDto, @CurrentUser() user: { id: number }) {
    return this.teamsService.create(createTeamDto, user.id);
  }

  // Get all teams (admin only)
  @Get()
  @Roles(UserRole.ADMIN)
  findAll() {
    return this.teamsService.findAll();
  }

  // Get teams owned by current user
  @Get('my-teams')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  findMyTeams(@CurrentUser() user: { id: number }) {
    return this.teamsService.findByOwner(user.id);
  }

  // Get teams where current user is a member
  @Get('member-of')
  findMemberOf(@CurrentUser() user: { id: number }) {
    return this.teamsService.findByMember(user.id);
  }

  // Get a specific team
  @Get(':id')
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.findOne(id);
  }

  // Update a team
  @Patch(':id')
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateTeamDto: UpdateTeamDto,
    @CurrentUser() user: { id: number }
  ) {
    return this.teamsService.update(id, updateTeamDto, user.id);
  }

  // Delete a team
  @Delete(':id')
  remove(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.teamsService.remove(id, user.id);
  }

  // Get team members
  @Get(':id/members')
  getMembers(@Param('id', ParseIntPipe) id: number) {
    return this.teamsService.getMembers(id);
  }

  // Add a team member directly
  @Post(':id/members')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  addMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() addMemberDto: AddTeamMemberDto,
    @CurrentUser() user: { id: number }
  ) {
    return this.teamsService.addMember(id, addMemberDto, user.id);
  }

  // Update team member details
  @Patch(':id/members/:userId')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  updateMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Body() updateData: { jerseyNumber?: number; position?: string },
    @CurrentUser() user: { id: number }
  ) {
    return this.teamsService.updateMember(id, userId, updateData, user.id);
  }

  // Remove a team member
  @Delete(':id/members/:userId')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  removeMember(
    @Param('id', ParseIntPipe) id: number,
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() user: { id: number }
  ) {
    return this.teamsService.removeMember(id, userId, user.id);
  }

  // Send team invitation
  @Post(':id/invitations')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  inviteMember(
    @Param('id', ParseIntPipe) id: number,
    @Body() inviteDto: InviteTeamMemberDto,
    @CurrentUser() user: { id: number }
  ) {
    return this.teamsService.inviteMember(id, inviteDto, user.id);
  }

  // Get team invitations
  @Get(':id/invitations')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  getInvitations(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.teamsService.getInvitations(id, user.id);
  }

  // Accept invitation (public endpoint with token)
  @Post('invitations/:token/accept')
  acceptInvitation(@Param('token') token: string, @CurrentUser() user: { id: number }) {
    return this.teamsService.acceptInvitation(token, user.id);
  }

  // Decline invitation (public endpoint with token)
  @Post('invitations/:token/decline')
  declineInvitation(@Param('token') token: string) {
    return this.teamsService.declineInvitation(token);
  }

  // Cancel invitation
  @Delete('invitations/:id')
  @Roles(UserRole.ADMIN, UserRole.COACH)
  cancelInvitation(@Param('id', ParseIntPipe) id: number, @CurrentUser() user: { id: number }) {
    return this.teamsService.cancelInvitation(id, user.id);
  }
}
