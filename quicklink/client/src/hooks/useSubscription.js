/**
 * @file       useSubscription.js
 * @description React hook linking pricing lists, checkout, billing stats, and cancellation flows.
 * @module     hooks/useSubscription
 * @requires   react
 * @requires   api/subscriptionApi
 * @requires   react-hot-toast
 */

import { useState, useEffect, useCallback } from 'react';
import * as subApi from '../api/subscriptionApi';
import { toast } from 'react-hot-toast';

export const useSubscription = (autoFetch = false) => {
  const [plans, setPlans] = useState([]);
  const [currentPlan, setCurrentPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [usage, setUsage] = useState(null);
  const [payments, setPayments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await subApi.getPlans();
      if (response.success && response.data) {
        setPlans(response.data.plans || []);
      }
    } catch (error) {
      console.error('Failed to load pricing plans:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentSubscription = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await subApi.getCurrentSubscription();
      if (response.success && response.data) {
        setSubscription(response.data.subscription);
        setCurrentPlan(response.data.plan);
        setUsage(response.data.usage);
      }
    } catch (error) {
      console.error('Failed to load user subscription info:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchUsage = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await subApi.getUsageStats();
      if (response.success && response.data) {
        setUsage(response.data.usage);
      }
    } catch (error) {
      console.error('Failed to fetch limit usage stats:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const fetchPayments = useCallback(async () => {
    setIsLoading(true);
    try {
      const response = await subApi.getPaymentHistory();
      if (response.success && response.data) {
        setPayments(response.data.payments || []);
      }
    } catch (error) {
      console.error('Failed to load invoice history:', error.message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const upgradeToPlan = async (planId) => {
    setIsLoading(true);
    try {
      const response = await subApi.createCheckoutSession(planId);
      if (response.success && response.data?.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        throw new Error('Could not generate checkout session redirect');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Payment checkout initiation failed.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const openBillingPortal = async () => {
    setIsLoading(true);
    try {
      const response = await subApi.createPortalSession();
      if (response.success && response.data?.portalUrl) {
        window.location.href = response.data.portalUrl;
      } else {
        throw new Error('Could not load billing portal session');
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Failed to open billing portal.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const cancelPlan = async () => {
    setIsLoading(true);
    try {
      const response = await subApi.cancelSubscription();
      if (response.success) {
        toast.success(response.message || 'Plan scheduled for cancellation.');
        await fetchCurrentSubscription();
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Cancellation request failed.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const reactivatePlan = async () => {
    setIsLoading(true);
    try {
      const response = await subApi.reactivateSubscription();
      if (response.success) {
        toast.success('Your subscription has been reactivated!');
        await fetchCurrentSubscription();
      }
    } catch (error) {
      const errMsg = error.response?.data?.message || error.message || 'Reactivation request failed.';
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (autoFetch) {
      fetchPlans();
      fetchCurrentSubscription();
      fetchPayments();
    }
  }, [autoFetch, fetchPlans, fetchCurrentSubscription, fetchPayments]);

  const planId = subscription?.planId || 'free';
  const isPro = planId === 'pro';
  const isBusiness = planId === 'business';

  return {
    plans,
    currentPlan,
    subscription,
    usage,
    payments,
    isLoading,
    isPro,
    isBusiness,
    fetchPlans,
    fetchCurrentSubscription,
    fetchUsage,
    fetchPayments,
    upgradeToPlan,
    openBillingPortal,
    cancelPlan,
    reactivatePlan,
  };
};
