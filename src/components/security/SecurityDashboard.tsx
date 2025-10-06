/**
 * Guardian Security Dashboard
 * Comprehensive security monitoring and management interface
 */

import React, { useState, useEffect } from 'react';
import {
  Shield,
  AlertTriangle,
  Lock,
  Eye,
  Activity,
  Users,
  Database,
  FileText,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
} from 'lucide-react';

import { authSecurity, getSecurityMetrics as getAuthMetrics } from '../../security/authSecurity';
import { getAuditStatistics } from '../../security/auditLogging';
import { generateGDPRReport } from '../../security/gdprCompliance';
import { runSecurityScan, getVulnerabilities } from '../../security/penetrationTesting';
import { getSecurityStats as getHeaderStats } from '../../security/securityHeaders';

interface SecurityMetrics {
  authentication: {
    loginAttempts: number;
    successfulLogins: number;
    failedLogins: number;
    mfaChallenges: number;
    blockedAttempts: number;
    suspiciousActivity: number;
    activeSessions: number;
    riskDistribution: { low: number; medium: number; high: number; critical: number };
  };
  rateLimiting: {
    totalRequests: number;
    blockedRequests: number;
    ddosAttempts: number;
    uniqueAttackers: number;
    topAttackVectors: Array<{ type: string; count: number; severity: string }>;
    blockedIps: string[];
    suspiciousPatterns: string[];
  };
  audit: {
    eventCount: number;
    eventsByType: Record<string, number>;
    eventsBySeverity: Record<string, number>;
    failureRate: number;
    topUsers: Array<{ userId: string; count: number }>;
    recentSecurityEvents: any[];
    alertsTriggered: number;
  };
  vulnerabilities: {
    total: number;
    critical: number;
    high: number;
    medium: number;
    low: number;
    newThisWeek: number;
    fixedThisWeek: number;
  };
  compliance: {
    score: number;
    dataSubjects: number;
    activeConsents: number;
    dsrRequests: number;
    dataBreaches: number;
  };
}

interface SecurityAlert {
  id: string;
  type: 'critical' | 'high' | 'medium' | 'low' | 'info';
  title: string;
  description: string;
  timestamp: string;
  acknowledged: boolean;
  source: string;
}

const SecurityDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<SecurityMetrics | null>(null);
  const [alerts, setAlerts] = useState<SecurityAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [scanRunning, setScanRunning] = useState(false);
  const [lastScanTime, setLastScanTime] = useState<string | null>(null);

  useEffect(() => {
    loadSecurityMetrics();
    loadSecurityAlerts();

    // Refresh every 30 seconds
    const interval = setInterval(() => {
      loadSecurityMetrics();
      loadSecurityAlerts();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  const loadSecurityMetrics = async () => {
    try {
      setLoading(true);

      // Load metrics from all security components
      const authMetrics = getAuthMetrics('24h');
      // const rateLimitMetrics = getRateLimitMetrics('24h'); // Function not exported
      const auditMetrics = getAuditStatistics('24h');
      const vulnerabilities = getVulnerabilities();

      // Calculate vulnerability metrics
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

      const vulnerabilityMetrics = {
        total: vulnerabilities.length,
        critical: vulnerabilities.filter(v => v.severity === 'critical').length,
        high: vulnerabilities.filter(v => v.severity === 'high').length,
        medium: vulnerabilities.filter(v => v.severity === 'medium').length,
        low: vulnerabilities.filter(v => v.severity === 'low').length,
        newThisWeek: vulnerabilities.filter(v => new Date(v.discoveredAt) >= weekAgo).length,
        fixedThisWeek: vulnerabilities.filter(v => v.fixedAt && new Date(v.fixedAt) >= weekAgo)
          .length,
      };

      // Generate GDPR compliance report
      const startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();
      const endDate = now.toISOString();
      const gdprReport = generateGDPRReport(startDate, endDate);

      const complianceMetrics = {
        score: gdprReport.summary.complianceScore,
        dataSubjects: gdprReport.summary.totalDataSubjects,
        activeConsents: gdprReport.summary.activeConsents,
        dsrRequests: gdprReport.summary.dsrRequests,
        dataBreaches: gdprReport.summary.dataBreaches,
      };

      setMetrics({
        authentication: authMetrics,
        rateLimiting: {} as any, // rateLimitMetrics not available
        audit: auditMetrics,
        vulnerabilities: vulnerabilityMetrics,
        compliance: complianceMetrics,
      });
    } catch (error) {
      console.error('Failed to load security metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSecurityAlerts = () => {
    // In a real implementation, this would fetch from a security alerting system
    const mockAlerts: SecurityAlert[] = [
      {
        id: '1',
        type: 'critical',
        title: 'Multiple Failed Login Attempts',
        description: 'Detected 15 failed login attempts from IP 10.0.0.1 in the last hour',
        timestamp: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
        acknowledged: false,
        source: 'Authentication System',
      },
      {
        id: '2',
        type: 'high',
        title: 'Suspicious API Usage Pattern',
        description: 'Unusual API request pattern detected from user ID user123',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        acknowledged: false,
        source: 'Rate Limiting System',
      },
      {
        id: '3',
        type: 'medium',
        title: 'GDPR Data Subject Request',
        description: 'New data subject access request requires attention',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        acknowledged: true,
        source: 'GDPR Compliance',
      },
    ];

    setAlerts(mockAlerts);
  };

  const runVulnerabilityScan = async () => {
    setScanRunning(true);

    try {
      const scanConfig = {
        target: {
          baseUrl: window.location.origin,
          endpoints: ['/api/auth', '/api/users', '/api/formations', '/dashboard'],
          excludePatterns: ['/health', '/metrics'],
        },
        scope: {
          includeCategories: [],
          excludeCategories: [],
          aggressiveMode: false,
          maxDuration: 300, // 5 minutes
        },
        reporting: {
          generateReport: true,
          includeEvidence: true,
          notifyOnCritical: true,
          exportFormats: ['json', 'html'],
        },
      };

      const result = await runSecurityScan(scanConfig as any);
      setLastScanTime(new Date().toISOString());

      // Reload metrics to include new vulnerabilities
      await loadSecurityMetrics();

      console.info('Security scan completed:', result);
    } catch (error) {
      console.error('Security scan failed:', error);
    } finally {
      setScanRunning(false);
    }
  };

  const acknowledgeAlert = (alertId: string) => {
    setAlerts(prev =>
      prev.map(alert => (alert.id === alertId ? { ...alert, acknowledged: true } : alert))
    );
  };

  const getAlertIcon = (type: SecurityAlert['type']) => {
    switch (type) {
      case 'critical':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'high':
        return <AlertTriangle className="h-5 w-5 text-orange-500" />;
      case 'medium':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'low':
        return <Info className="h-5 w-5 text-blue-500" />;
      case 'info':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      default:
        return <Info className="h-5 w-5 text-gray-500" />;
    }
  };

  const calculateOverallSecurityScore = () => {
    if (!metrics) {
      return 0;
    }

    let score = 100;

    // Deduct points for vulnerabilities
    score -= metrics.vulnerabilities.critical * 20;
    score -= metrics.vulnerabilities.high * 10;
    score -= metrics.vulnerabilities.medium * 5;
    score -= metrics.vulnerabilities.low * 1;

    // Deduct points for security events
    score -= Math.min(metrics.audit.alertsTriggered * 2, 20);

    // Deduct points for failed authentication
    const authFailureRate =
      metrics.authentication.failedLogins / (metrics.authentication.loginAttempts || 1);
    score -= authFailureRate * 30;

    // Add points for good compliance
    score += (metrics.compliance.score - 80) * 0.2;

    return Math.max(0, Math.min(100, Math.round(score)));
  };

  const getScoreColor = (score: number) => {
    if (score >= 90) {
      return 'text-green-600';
    }
    if (score >= 70) {
      return 'text-yellow-600';
    }
    if (score >= 50) {
      return 'text-orange-600';
    }
    return 'text-red-600';
  };

  if (loading && !metrics) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const overallScore = calculateOverallSecurityScore();

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <Shield className="h-8 w-8 text-blue-600" />
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Security Dashboard</h1>
            <p className="text-gray-600">Guardian Security Monitoring & Management</p>
          </div>
        </div>

        <div className="flex items-center space-x-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Overall Security Score</div>
            <div className={`text-2xl font-bold ${getScoreColor(overallScore)}`}>
              {overallScore}/100
            </div>
          </div>

          <button
            onClick={runVulnerabilityScan}
            disabled={scanRunning}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            <Activity className={`h-4 w-4 ${scanRunning ? 'animate-spin' : ''}`} />
            <span>{scanRunning ? 'Scanning...' : 'Run Security Scan'}</span>
          </button>
        </div>
      </div>

      {/* Security Alerts */}
      {alerts.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Security Alerts</h2>
            <div className="text-sm text-gray-500">
              {alerts.filter(a => !a.acknowledged).length} unacknowledged
            </div>
          </div>

          <div className="space-y-3">
            {alerts.slice(0, 5).map(alert => (
              <div
                key={alert.id}
                className={`flex items-center justify-between p-4 rounded-lg border ${
                  alert.acknowledged ? 'bg-gray-50 border-gray-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {getAlertIcon(alert.type)}
                  <div>
                    <div className="font-medium text-gray-900">{alert.title}</div>
                    <div className="text-sm text-gray-600">{alert.description}</div>
                    <div className="text-xs text-gray-500">
                      {new Date(alert.timestamp).toLocaleString()} • {alert.source}
                    </div>
                  </div>
                </div>

                {!alert.acknowledged && (
                  <button
                    onClick={() => acknowledgeAlert(alert.id)}
                    className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Acknowledge
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Authentication Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Lock className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-gray-900">Authentication</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.authentication.activeSessions || 0}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Login Success Rate</span>
              <span className="font-medium">
                {metrics?.authentication.loginAttempts
                  ? Math.round(
                      (metrics.authentication.successfulLogins /
                        metrics.authentication.loginAttempts) *
                        100
                    )
                  : 0}
                %
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Failed Logins</span>
              <span className="font-medium text-red-600">
                {metrics?.authentication.failedLogins || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">MFA Challenges</span>
              <span className="font-medium">{metrics?.authentication.mfaChallenges || 0}</span>
            </div>
          </div>
        </div>

        {/* Rate Limiting Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Activity className="h-5 w-5 text-green-600" />
              <span className="font-medium text-gray-900">Rate Limiting</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.rateLimiting.totalRequests || 0}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Blocked Requests</span>
              <span className="font-medium text-red-600">
                {metrics?.rateLimiting.blockedRequests || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">DDoS Attempts</span>
              <span className="font-medium text-orange-600">
                {metrics?.rateLimiting.ddosAttempts || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Blocked IPs</span>
              <span className="font-medium">{metrics?.rateLimiting.blockedIps.length || 0}</span>
            </div>
          </div>
        </div>

        {/* Vulnerability Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Eye className="h-5 w-5 text-purple-600" />
              <span className="font-medium text-gray-900">Vulnerabilities</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.vulnerabilities.total || 0}
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Critical</span>
              <span className="font-medium text-red-600">
                {metrics?.vulnerabilities.critical || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">High</span>
              <span className="font-medium text-orange-600">
                {metrics?.vulnerabilities.high || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Fixed This Week</span>
              <span className="font-medium text-green-600">
                {metrics?.vulnerabilities.fixedThisWeek || 0}
              </span>
            </div>
          </div>
        </div>

        {/* Compliance Metrics */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-indigo-600" />
              <span className="font-medium text-gray-900">GDPR Compliance</span>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              {metrics?.compliance.score || 0}%
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Data Subjects</span>
              <span className="font-medium">{metrics?.compliance.dataSubjects || 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Active Consents</span>
              <span className="font-medium text-green-600">
                {metrics?.compliance.activeConsents || 0}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">DSR Requests</span>
              <span className="font-medium">{metrics?.compliance.dsrRequests || 0}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Analytics */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8" aria-label="Tabs">
            {[
              { id: 'overview', label: 'Security Overview', icon: Shield },
              { id: 'threats', label: 'Threat Intelligence', icon: AlertTriangle },
              { id: 'audit', label: 'Audit Logs', icon: FileText },
              { id: 'compliance', label: 'Compliance', icon: Database },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Security Trends</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="text-red-800 font-medium">High-Risk Events</div>
                    <div className="text-2xl font-bold text-red-900">
                      {(metrics?.authentication.riskDistribution.critical || 0) +
                        (metrics?.authentication.riskDistribution.high || 0)}
                    </div>
                  </div>
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="text-yellow-800 font-medium">Medium-Risk Events</div>
                    <div className="text-2xl font-bold text-yellow-900">
                      {metrics?.authentication.riskDistribution.medium || 0}
                    </div>
                  </div>
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="text-green-800 font-medium">Low-Risk Events</div>
                    <div className="text-2xl font-bold text-green-900">
                      {metrics?.authentication.riskDistribution.low || 0}
                    </div>
                  </div>
                </div>
              </div>

              {lastScanTime && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <Clock className="h-5 w-5 text-blue-600" />
                    <span className="text-blue-800 font-medium">Last Security Scan</span>
                  </div>
                  <div className="text-blue-700">{new Date(lastScanTime).toLocaleString()}</div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'threats' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Top Attack Vectors</h3>
              <div className="space-y-3">
                {metrics?.rateLimiting.topAttackVectors.slice(0, 10).map((vector, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">{vector.type}</div>
                      <div className="text-sm text-gray-600">Severity: {vector.severity}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">{vector.count}</div>
                      <div className="text-sm text-gray-600">attempts</div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-4">
              <h3 className="text-lg font-medium text-gray-900">Recent Security Events</h3>
              <div className="space-y-3">
                {metrics?.audit.recentSecurityEvents.slice(0, 10).map((event, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                  >
                    <div>
                      <div className="font-medium text-gray-900">
                        {event.description || 'Security Event'}
                      </div>
                      <div className="text-sm text-gray-600">
                        {event.timestamp ? new Date(event.timestamp).toLocaleString() : 'Recent'}
                      </div>
                    </div>
                    <div
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        event.severity === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : event.severity === 'high'
                            ? 'bg-orange-100 text-orange-800'
                            : event.severity === 'medium'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-blue-100 text-blue-800'
                      }`}
                    >
                      {event.severity || 'info'}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'compliance' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">GDPR Compliance Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <div className="text-sm text-gray-600 mb-2">Overall Compliance Score</div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-blue-600 h-2 rounded-full"
                        style={{ width: `${metrics?.compliance.score || 0}%` }}
                      ></div>
                    </div>
                    <div className="text-lg font-bold text-gray-900 mt-2">
                      {metrics?.compliance.score || 0}%
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Subjects</span>
                      <span className="font-medium">{metrics?.compliance.dataSubjects || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Active Consents</span>
                      <span className="font-medium">{metrics?.compliance.activeConsents || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">DSR Requests</span>
                      <span className="font-medium">{metrics?.compliance.dsrRequests || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Data Breaches</span>
                      <span className="font-medium text-red-600">
                        {metrics?.compliance.dataBreaches || 0}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SecurityDashboard;
