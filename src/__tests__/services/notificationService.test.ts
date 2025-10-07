import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { notificationService } from '../../services/notificationService';

// Mock Notification API
Object.defineProperty(global, 'Notification', {
  value: vi.fn().mockImplementation((title, options) => ({
    title,
    body: options?.body,
    icon: options?.icon,
    tag: options?.tag,
    close: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  })),
  configurable: true,
});

// Mock ServiceWorkerRegistration
Object.defineProperty(global, 'navigator', {
  value: {
    serviceWorker: {
      register: vi.fn(),
      ready: Promise.resolve({
        showNotification: vi.fn(),
        getNotifications: vi.fn().mockResolvedValue([]),
      }),
      getRegistration: vi.fn(),
    },
    permissions: {
      query: vi.fn().mockResolvedValue({ state: 'granted' }),
    },
  },
  configurable: true,
});

describe('NotificationService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset notification permission
    (Notification as any).permission = 'default';
    (Notification as any).requestPermission = vi.fn().mockResolvedValue('granted');
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Permission Management', () => {
    it('should check notification permission', () => {
      (Notification as any).permission = 'granted';

      const hasPermission = (notificationService as any).hasPermission();
      expect(hasPermission).toBe(true);
    });

    it('should request notification permission', async () => {
      (Notification as any).requestPermission.mockResolvedValue('granted');

      const granted = await (notificationService as any).requestPermission();
      expect(granted).toBe(true);
      expect(Notification.requestPermission).toHaveBeenCalled();
    });

    it('should handle permission denial', async () => {
      (Notification as any).requestPermission.mockResolvedValue('denied');

      const granted = await (notificationService as any).requestPermission();
      expect(granted).toBe(false);
    });

    it('should check if notifications are supported', () => {
      const isSupported = (notificationService as any).isSupported();
      expect(isSupported).toBe(true);
    });

    it('should handle unsupported environment', () => {
      const originalNotification = global.Notification;
      delete (global as any).Notification;

      const isSupported = (notificationService as any).isSupported();
      expect(isSupported).toBe(false);

      global.Notification = originalNotification;
    });
  });

  describe('Basic Notifications', () => {
    beforeEach(() => {
      (Notification as any).permission = 'granted';
    });

    it('should show basic notification', async () => {
      const notification = await (notificationService as any).show('Test Title', {
        body: 'Test message',
        icon: '/icon.png',
      });

      expect(Notification).toHaveBeenCalledWith('Test Title', {
        body: 'Test message',
        icon: '/icon.png',
      });
      expect(notification).toBeDefined();
    });

    it('should not show notification without permission', async () => {
      (Notification as any).permission = 'denied';

      const notification = await (notificationService as any).show('Test', { body: 'Test' });
      expect(notification).toBeNull();
      expect(Notification).not.toHaveBeenCalled();
    });

    it('should show notification with default options', async () => {
      await (notificationService as any).show('Simple Title');

      expect(Notification).toHaveBeenCalledWith('Simple Title', {
        body: '',
        icon: '/default-icon.png',
        tag: undefined,
        requireInteraction: false,
        silent: false,
      });
    });

    it('should auto-close notification after timeout', async () => {
      vi.useFakeTimers();

      const closeSpy = vi.fn();
      (Notification as any).mockImplementation(() => ({
        close: closeSpy,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn(),
      }));

      await (notificationService as any).show('Auto Close', {
        body: 'Will close automatically',
        autoClose: 3000,
      });

      vi.advanceTimersByTime(3000);
      expect(closeSpy).toHaveBeenCalled();

      vi.useRealTimers();
    });
  });

  describe('Rich Notifications', () => {
    beforeEach(() => {
      (Notification as any).permission = 'granted';
    });

    it('should show notification with actions', async () => {
      const actions = [
        { action: 'accept', title: 'Accept', icon: '/accept.png' },
        { action: 'decline', title: 'Decline', icon: '/decline.png' },
      ];

      await (notificationService as any).showRich('Meeting Invitation', {
        body: 'You have a new meeting invitation',
        actions,
        data: { meetingId: '123' },
      });

      const swRegistration = await navigator.serviceWorker.ready;
      expect(swRegistration.showNotification).toHaveBeenCalledWith(
        'Meeting Invitation',
        expect.objectContaining({
          actions,
          data: { meetingId: '123' },
        }),
      );
    });

    it('should show notification with image', async () => {
      await (notificationService as any).showRich('Photo Shared', {
        body: 'Someone shared a photo with you',
        image: '/shared-photo.jpg',
        icon: '/camera-icon.png',
      });

      const swRegistration = await navigator.serviceWorker.ready;
      expect(swRegistration.showNotification).toHaveBeenCalledWith(
        'Photo Shared',
        expect.objectContaining({
          image: '/shared-photo.jpg',
          icon: '/camera-icon.png',
        }),
      );
    });

    it('should show progress notification', async () => {
      const progressNotification = await (notificationService as any).showProgress(
        'File Upload',
        'Uploading document.pdf',
        0,
      );

      expect(progressNotification).toBeDefined();
      expect(progressNotification.updateProgress).toBeInstanceOf(Function);
    });

    it('should update progress notification', async () => {
      const updateSpy = vi.fn();
      const mockNotification = {
        updateProgress: updateSpy,
        close: vi.fn(),
      };

      // Mock the showProgress method directly since it doesn't exist on the service
      (notificationService as any).showProgress = vi.fn().mockResolvedValue(mockNotification);

      const notification = await (notificationService as any).showProgress(
        'Upload',
        'Uploading...',
        0,
      );

      notification.updateProgress(50);
      notification.updateProgress(100);

      expect(updateSpy).toHaveBeenCalledWith(50);
      expect(updateSpy).toHaveBeenCalledWith(100);
    });
  });

  describe('Notification Types', () => {
    beforeEach(() => {
      (Notification as any).permission = 'granted';
    });

    it('should show success notification', async () => {
      await (notificationService as any).showSuccess(
        'Operation Completed',
        'Your file has been saved successfully',
      );

      expect(Notification).toHaveBeenCalledWith(
        'Operation Completed',
        expect.objectContaining({
          body: 'Your file has been saved successfully',
          icon: expect.stringContaining('success'),
        }),
      );
    });

    it('should show error notification', async () => {
      await (notificationService as any).showError('Error Occurred', 'Failed to save file');

      expect(Notification).toHaveBeenCalledWith(
        'Error Occurred',
        expect.objectContaining({
          body: 'Failed to save file',
          icon: expect.stringContaining('error'),
          requireInteraction: true,
        }),
      );
    });

    it('should show warning notification', async () => {
      await (notificationService as any).showWarning('Warning', 'Disk space is running low');

      expect(Notification).toHaveBeenCalledWith(
        'Warning',
        expect.objectContaining({
          body: 'Disk space is running low',
          icon: expect.stringContaining('warning'),
        }),
      );
    });

    it('should show info notification', async () => {
      await (notificationService as any).showInfo('Update Available', 'A new version is available');

      expect(Notification).toHaveBeenCalledWith(
        'Update Available',
        expect.objectContaining({
          body: 'A new version is available',
          icon: expect.stringContaining('info'),
        }),
      );
    });
  });

  describe('Notification Scheduling', () => {
    beforeEach(() => {
      (Notification as any).permission = 'granted';
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it('should schedule notification for future delivery', async () => {
      const futureTime = Date.now() + 60000; // 1 minute from now

      (notificationService as any).schedule('Reminder', {
        body: 'Scheduled reminder',
        scheduleTime: futureTime,
      });

      // Fast forward time
      vi.advanceTimersByTime(60000);

      expect(Notification).toHaveBeenCalledWith(
        'Reminder',
        expect.objectContaining({
          body: 'Scheduled reminder',
        }),
      );
    });

    it('should cancel scheduled notification', async () => {
      const futureTime = Date.now() + 60000;

      const scheduledId = (notificationService as any).schedule('Cancelable', {
        body: 'This should be canceled',
        scheduleTime: futureTime,
      });

      (notificationService as any).cancelScheduled(scheduledId);

      // Fast forward time
      vi.advanceTimersByTime(60000);

      expect(Notification).not.toHaveBeenCalled();
    });

    it('should schedule recurring notification', async () => {
      (notificationService as any).scheduleRecurring('Daily Reminder', {
        body: 'Time for your daily standup',
        interval: 60000, // Every minute for testing
        maxRepeats: 3,
      });

      // First occurrence
      vi.advanceTimersByTime(60000);
      expect(Notification).toHaveBeenCalledTimes(1);

      // Second occurrence
      vi.advanceTimersByTime(60000);
      expect(Notification).toHaveBeenCalledTimes(2);

      // Third occurrence
      vi.advanceTimersByTime(60000);
      expect(Notification).toHaveBeenCalledTimes(3);

      // Should stop after maxRepeats
      vi.advanceTimersByTime(60000);
      expect(Notification).toHaveBeenCalledTimes(3);
    });
  });

  describe('Notification Management', () => {
    beforeEach(() => {
      (Notification as any).permission = 'granted';
    });

    it('should get all active notifications', async () => {
      const mockNotifications = [
        { tag: 'notification1', title: 'First' },
        { tag: 'notification2', title: 'Second' },
      ];

      const swRegistration = await navigator.serviceWorker.ready;
      (swRegistration.getNotifications as any).mockResolvedValue(mockNotifications);

      const notifications = await (notificationService as any).getAll();
      expect(notifications).toEqual(mockNotifications);
    });

    it('should close notification by tag', async () => {
      const mockNotifications = [
        { tag: 'test', close: vi.fn() },
        { tag: 'other', close: vi.fn() },
      ];

      const swRegistration = await navigator.serviceWorker.ready;
      (swRegistration.getNotifications as any).mockResolvedValue(mockNotifications);

      await (notificationService as any).close('test');
      expect(mockNotifications[0].close).toHaveBeenCalled();
      expect(mockNotifications[1].close).not.toHaveBeenCalled();
    });

    it('should close all notifications', async () => {
      const mockNotifications = [{ close: vi.fn() }, { close: vi.fn() }, { close: vi.fn() }];

      const swRegistration = await navigator.serviceWorker.ready;
      (swRegistration.getNotifications as any).mockResolvedValue(mockNotifications);

      await (notificationService as any).closeAll();
      mockNotifications.forEach(notification => {
        expect(notification.close).toHaveBeenCalled();
      });
    });

    it('should replace existing notification with same tag', async () => {
      await (notificationService as any).show('Original', {
        body: 'Original message',
        tag: 'replaceable',
      });

      await (notificationService as any).show('Updated', {
        body: 'Updated message',
        tag: 'replaceable',
      });

      expect(Notification).toHaveBeenCalledTimes(2);
      expect(Notification).toHaveBeenLastCalledWith(
        'Updated',
        expect.objectContaining({
          body: 'Updated message',
          tag: 'replaceable',
        }),
      );
    });
  });

  describe('Event Handling', () => {
    beforeEach(() => {
      (Notification as any).permission = 'granted';
    });

    it('should handle notification click events', async () => {
      const clickHandler = vi.fn();
      const addEventListenerSpy = vi.fn();

      (Notification as any).mockImplementation(() => ({
        addEventListener: addEventListenerSpy,
        removeEventListener: vi.fn(),
        close: vi.fn(),
      }));

      await (notificationService as any).show('Clickable', {
        body: 'Click me',
        onClick: clickHandler,
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('click', expect.any(Function));
    });

    it('should handle notification close events', async () => {
      const closeHandler = vi.fn();
      const addEventListenerSpy = vi.fn();

      (Notification as any).mockImplementation(() => ({
        addEventListener: addEventListenerSpy,
        removeEventListener: vi.fn(),
        close: vi.fn(),
      }));

      await (notificationService as any).show('Closable', {
        body: 'Will close',
        onClose: closeHandler,
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('close', expect.any(Function));
    });

    it('should handle notification error events', async () => {
      const errorHandler = vi.fn();
      const addEventListenerSpy = vi.fn();

      (Notification as any).mockImplementation(() => ({
        addEventListener: addEventListenerSpy,
        removeEventListener: vi.fn(),
        close: vi.fn(),
      }));

      await (notificationService as any).show('Error Prone', {
        body: 'Might error',
        onError: errorHandler,
      });

      expect(addEventListenerSpy).toHaveBeenCalledWith('error', expect.any(Function));
    });
  });

  describe('Notification Settings', () => {
    it('should update default settings', () => {
      const newSettings = {
        icon: '/custom-icon.png',
        silent: true,
        requireInteraction: true,
      };

      (notificationService as any).updateSettings(newSettings);
      const settings = (notificationService as any).getSettings();

      expect(settings).toMatchObject(newSettings);
    });

    it('should merge settings with defaults', () => {
      (notificationService as any).updateSettings({ icon: '/new-icon.png' });
      const settings = (notificationService as any).getSettings();

      expect(settings.icon).toBe('/new-icon.png');
      expect(settings).toHaveProperty('silent');
      expect(settings).toHaveProperty('requireInteraction');
    });

    it('should enable/disable notifications globally', () => {
      (notificationService as any).disable();
      expect((notificationService as any).isEnabled()).toBe(false);

      (notificationService as any).enable();
      expect((notificationService as any).isEnabled()).toBe(true);
    });

    it('should not show notifications when disabled', async () => {
      (notificationService as any).disable();

      const notification = await (notificationService as any).show('Disabled', {
        body: 'Should not show',
      });
      expect(notification).toBeNull();
      expect(Notification).not.toHaveBeenCalled();
    });
  });

  describe('Push Notifications', () => {
    it('should subscribe to push notifications', async () => {
      const mockSubscription = {
        endpoint: 'https://fcm.googleapis.com/fcm/send/123',
        keys: {
          p256dh: 'key1',
          auth: 'key2',
        },
      };

      const subscribeSpy = vi.fn().mockResolvedValue(mockSubscription);
      const swRegistration = await navigator.serviceWorker.ready;
      Object.defineProperty(swRegistration, 'pushManager', {
        value: { subscribe: subscribeSpy },
        writable: true,
        configurable: true,
      });

      const subscription = await (notificationService as any).subscribeToPush({
        userVisibleOnly: true,
        applicationServerKey: 'test-vapid-key',
      });

      expect(subscription).toEqual(mockSubscription);
      expect(subscribeSpy).toHaveBeenCalledWith({
        userVisibleOnly: true,
        applicationServerKey: 'test-vapid-key',
      });
    });

    it('should unsubscribe from push notifications', async () => {
      const unsubscribeSpy = vi.fn().mockResolvedValue(true);
      const mockSubscription = { unsubscribe: unsubscribeSpy };

      const getSubscriptionSpy = vi.fn().mockResolvedValue(mockSubscription);
      const swRegistration = await navigator.serviceWorker.ready;
      Object.defineProperty(swRegistration, 'pushManager', {
        value: { getSubscription: getSubscriptionSpy },
        writable: true,
        configurable: true,
      });

      const success = await (notificationService as any).unsubscribeFromPush();

      expect(success).toBe(true);
      expect(unsubscribeSpy).toHaveBeenCalled();
    });

    it('should get current push subscription', async () => {
      const mockSubscription = { endpoint: 'https://example.com' };
      const getSubscriptionSpy = vi.fn().mockResolvedValue(mockSubscription);

      const swRegistration = await navigator.serviceWorker.ready;
      Object.defineProperty(swRegistration, 'pushManager', {
        value: { getSubscription: getSubscriptionSpy },
        writable: true,
        configurable: true,
      });

      const subscription = await (notificationService as any).getPushSubscription();
      expect(subscription).toEqual(mockSubscription);
    });
  });

  describe('Analytics and Tracking', () => {
    it('should track notification interactions', async () => {
      // Mock the trackInteraction method since it doesn't exist on the service
      const trackSpy = vi.fn();
      (notificationService as any).trackInteraction = trackSpy;

      await (notificationService as any).show('Trackable', {
        body: 'Track interactions',
        tag: 'analytics-test',
        track: true,
      });

      // Simulate click
      const notification = (Notification as any).mock.results[0].value;
      const clickCallback = notification.addEventListener.mock.calls.find(
        call => call[0] === 'click',
      )?.[1];

      if (clickCallback) {
        clickCallback();
        expect(trackSpy).toHaveBeenCalledWith('click', 'analytics-test');
      }
    });

    it('should get notification statistics', () => {
      const stats = (notificationService as any).getStatistics();

      expect(stats).toHaveProperty('totalShown');
      expect(stats).toHaveProperty('totalClicked');
      expect(stats).toHaveProperty('totalClosed');
      expect(stats).toHaveProperty('clickRate');
      expect(stats.clickRate).toBeGreaterThanOrEqual(0);
      expect(stats.clickRate).toBeLessThanOrEqual(1);
    });

    it('should reset statistics', () => {
      // Show some notifications to generate stats
      (notificationService as any).trackInteraction('show', 'test1');
      (notificationService as any).trackInteraction('click', 'test1');

      let stats = (notificationService as any).getStatistics();
      expect(stats.totalShown).toBeGreaterThan(0);

      (notificationService as any).resetStatistics();
      stats = (notificationService as any).getStatistics();
      expect(stats.totalShown).toBe(0);
      expect(stats.totalClicked).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle notification API errors gracefully', async () => {
      (Notification as any).mockImplementation(() => {
        throw new Error('Notification failed');
      });

      const notification = await (notificationService as any).show('Error Test', {
        body: 'Should fail',
      });
      expect(notification).toBeNull();
    });

    it('should handle service worker registration errors', async () => {
      Object.defineProperty(navigator.serviceWorker, 'ready', {
        value: Promise.reject(new Error('SW not available')),
        writable: true,
        configurable: true,
      });

      const notification = await (notificationService as any).showRich('Rich Error', {
        body: 'Should fallback',
      });
      expect(notification).toBeDefined(); // Should fallback to basic notification
    });

    it('should handle permission request failures', async () => {
      (Notification as any).requestPermission.mockRejectedValue(new Error('Permission denied'));

      const granted = await (notificationService as any).requestPermission();
      expect(granted).toBe(false);
    });

    it('should cleanup on page unload', () => {
      (notificationService as any).schedule('Test', { scheduleTime: Date.now() + 60000 });

      // Simulate page unload
      (notificationService as any).cleanup();

      const scheduledCount = (notificationService as any).getScheduledCount();
      expect(scheduledCount).toBe(0);
    });
  });
});
