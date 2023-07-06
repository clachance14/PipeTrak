import {
  CancelSubscription,
  CreateCheckoutLink,
  CreateCustomerPortalLink,
  GetAllPlans,
} from "../../types";

const getAllPlans: GetAllPlans = async function () {
  return [];
};

const createCheckoutLink: CreateCheckoutLink = async function ({
  variantIds,
  userData,
  storeId,
  redirectUrl,
}) {
  return "";
};

const createCustomerPortalLink: CreateCustomerPortalLink = async (params) => {
  return "";
};

const cancelSubscription: CancelSubscription = async (params) => {
  return;
};

export {
  cancelSubscription,
  createCheckoutLink,
  createCustomerPortalLink,
  getAllPlans,
};
