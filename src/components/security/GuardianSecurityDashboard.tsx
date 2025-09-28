/**
 * Guardian Security Dashboard
 * Real-time security monitoring and threat detection interface
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  ShieldX,
  AlertTriangle,
  Activity,
  Lock,
  Eye,
  FileText,
  Users,
  Clock,
  TrendingUp,
  TrendingDown,
  Zap,
  Globe,
  Server,
  Database,
  Wifi,
  AlertCircle,
  CheckCircle,
  XCircle,
  RefreshCw
} from 'lucide-react';
import { guardianSecuritySuite } from '../../security/guardianSecuritySuite';
import { guardianThreatDetection } from '../../security/threatDetection';
import { getSecurityMetrics } from '../../security/authSecurity';
import { getSecurityStats } from '../../security/securityHeaders';

interface SecurityMetrics {
  systemStatus: 'secure' | 'warning' | 'critical';
  activeThreats: number;
  blockedAttacks: number;
  complianceScore: number;
  vulnerabilityScore: number;
  activeSessions: number;
  lastSecurityScan: string;
  securityEvents: SecurityEvent[];
  recommendations: string[];
}

interface SecurityEvent {
  id: string;
  type: 'authentication' | 'authorization' | 'data_access' | 'threat_detected' | 'compliance_violation';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  timestamp: string;
  userId?: string;
  ipAddress?: string;
  resolved: boolean;
}

interface ThreatData {
  threatsDetected: number;
  threatsBlocked: number;
  threatsByType: Record<string, number>;
  threatsByLevel: Record<string, number>;
}

export const GuardianSecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics>({
    systemStatus: 'secure',
    activeThreats: 0,
    blockedAttacks: 0,
    complianceScore: 100,
    vulnerabilityScore: 95,
    activeSessions: 0,
    lastSecurityScan: new Date().toISOString(),
    securityEvents: [],
    recommendations: []
  });

  const [threatData, setThreatData] = useState<ThreatData>({
    threatsDetected: 0,
    threatsBlocked: 0,
    threatsByType: {},
    threatsByLevel: {}
  });

  const [timeframe, setTimeframe] = useState<'1h' | '24h' | '7d' | '30d'>('24h');
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date>(new Date());

  const loadSecurityData = useCallback(async () => {
    setLoading(true);
    try {
      // Load security dashboard data
      const dashboardData = await guardianSecuritySuite.getSecurityDashboard();
      setMetrics(dashboardData);

      // Load threat detection metrics
      const now = new Date();
      const startDate = new Date(now.getTime() - getTimeframeMs(timeframe));
      const threatMetrics = await guardianThreatDetection.getSecurityMetrics(startDate, now);
      setThreatData(threatMetrics);

      setLastUpdate(new Date());
    } catch (error) {
      console.error('Failed to load security data:', error);
    } finally {
      setLoading(false);
    }
  }, [timeframe]);

  useEffect(() => {
    loadSecurityData();
    
    // Auto-refresh every 30 seconds
    const interval = setInterval(loadSecurityData, 30000);
    return () => clearInterval(interval);
  }, [loadSecurityData]);

  const getTimeframeMs = (tf: string): number => {
    const timeframes = {
      '1h': 60 * 60 * 1000,
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
    };
    return timeframes[tf as keyof typeof timeframes] || timeframes['24h'];
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'secure':
        return <ShieldCheck className="w-6 h-6 text-green-500" />;
      case 'warning':
        return <ShieldAlert className="w-6 h-6 text-yellow-500" />;
      case 'critical':
        return <ShieldX className="w-6 h-6 text-red-500" />;
      default:
        return <Shield className="w-6 h-6 text-gray-500" />;
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'text-red-600 bg-red-100';
      case 'high':
        return 'text-orange-600 bg-orange-100';
      case 'medium':
        return 'text-yellow-600 bg-yellow-100';
      case 'low':
        return 'text-blue-600 bg-blue-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Shield className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Guardian Security Center</h1>
              <p className="text-gray-600">Real-time security monitoring and threat detection</p>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <select
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            >
              <option value="1h">Last Hour</option>
              <option value="24h">Last 24 Hours</option>
              <option value="7d">Last 7 Days</option>
              <option value="30d">Last 30 Days</option>
            </select>
            
            <button
              onClick={loadSecurityData}
              disabled={loading}
              className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </button>
          </div>
        </div>
        
        <div className="mt-4 text-sm text-gray-500">
          Last updated: {formatTimestamp(lastUpdate.toISOString())}
        </div>
      </div>

      {/* System Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">System Status</p>
              <p className="text-2xl font-bold text-gray-900 capitalize">{metrics.systemStatus}</p>
            </div>
            {getStatusIcon(metrics.systemStatus)}
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Threats</p>
              <p className="text-2xl font-bold text-red-600">{metrics.activeThreats}</p>
            </div>
            <AlertTriangle className="w-6 h-6 text-red-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Blocked Attacks</p>
              <p className="text-2xl font-bold text-green-600">{metrics.blockedAttacks}</p>
            </div>
            <ShieldCheck className="w-6 h-6 text-green-500" />
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Compliance Score</p>
              <p className="text-2xl font-bold text-blue-600">{metrics.complianceScore}%</p>
            </div>
            <CheckCircle className="w-6 h-6 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Threat Analysis */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Threat Analysis</h3>
          
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Threats Detected</span>
              <span className="font-semibold">{threatData.threatsDetected}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Threats Blocked</span>
              <span className="font-semibold text-green-600">{threatData.threatsBlocked}</span>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Threats by Type</h4>
              <div className="space-y-2">
                {Object.entries(threatData.threatsByType).map(([type, count]) => (
                  <div key={type} className="flex justify-between text-sm">
                    <span className="capitalize">{type.replace('_', ' ')}</span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
            
            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Threats by Level</h4>
              <div className="space-y-2">
                {Object.entries(threatData.threatsByLevel).map(([level, count]) => (
                  <div key={level} className="flex justify-between text-sm">
                    <span className={`capitalize px-2 py-1 rounded-full text-xs ${getSeverityColor(level)}`}>
                      {level}
                    </span>
                    <span>{count}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Security Metrics */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Security Metrics</h3>
          
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Users className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Active Sessions</span>
              </div>
              <span className="font-semibold">{metrics.activeSessions}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Activity className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Vulnerability Score</span>
              </div>
              <span className="font-semibold text-green-600">{metrics.vulnerabilityScore}%</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Clock className="w-4 h-4 text-gray-500" />
                <span className="text-sm text-gray-600">Last Security Scan</span>
              </div>
              <span className="text-sm text-gray-500">
                {formatTimestamp(metrics.lastSecurityScan)}
              </span>
            </div>
          </div>
          
          {/* Security Recommendations */}
          {metrics.recommendations.length > 0 && (
            <div className="mt-6 pt-4 border-t">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Security Recommendations</h4>
              <div className="space-y-2">
                {metrics.recommendations.slice(0, 3).map((recommendation, index) => (
                  <div key={index} className="flex items-start space-x-2">
                    <AlertCircle className="w-4 h-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm text-gray-600">{recommendation}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Recent Security Events */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Recent Security Events</h3>
        
        {metrics.securityEvents.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <Shield className="w-12 h-12 mx-auto mb-4 text-gray-300" />
            <p>No security events in the selected timeframe</p>
          </div>
        ) : (
          <div className="space-y-3">
            {metrics.securityEvents.slice(0, 10).map((event) => (
              <div
                key={event.id}
                className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <div className={`w-3 h-3 rounded-full ${
                    event.severity === 'critical' ? 'bg-red-500' :
                    event.severity === 'high' ? 'bg-orange-500' :
                    event.severity === 'medium' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`} />
                  
                  <div>
                    <p className="font-medium text-gray-900">{event.description}</p>
                    <div className="flex items-center space-x-4 mt-1 text-sm text-gray-500">
                      <span>Type: {event.type.replace('_', ' ')}</span>
                      {event.userId && <span>User: {event.userId}</span>}
                      {event.ipAddress && <span>IP: {event.ipAddress}</span>}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className={`px-2 py-1 rounded-full text-xs ${getSeverityColor(event.severity)}`}>
                    {event.severity.toUpperCase()}
                  </div>
                  
                  {event.resolved ? (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-500" />
                  )}
                  
                  <span className="text-sm text-gray-500">
                    {formatTimestamp(event.timestamp)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Security Status Bar */}
      <div className="fixed bottom-4 right-4 bg-white rounded-lg shadow-lg p-4 border">
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {getStatusIcon(metrics.systemStatus)}
            <span className="text-sm font-medium text-gray-700">Guardian Active</span>
          </div>
          
          <div className="h-4 w-px bg-gray-300" />
          
          <div className="flex items-center space-x-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
            <span className="text-xs text-gray-500">Monitoring</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GuardianSecurityDashboard;