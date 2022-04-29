require('dotenv').config();
const { PLATFORM_NAME, PLATFORM_URL, PLATFORM_HASHTAG } = process.env;

const commonFields = {};
//getting these fields from .env file
commonFields["PLATFORM_NAME"] = PLATFORM_NAME;
commonFields["PLATFORM_URL"] = PLATFORM_URL;
commonFields["PLATFORM_HASHTAG"] = PLATFORM_HASHTAG;

commonFields["FEEDBACK_EMAIL"] = "blockchain@rffny.org";
commonFields["CURRENCY"] = "USD";
commonFields["REGULATOR_NAME"] = "Rainforest Foundation US";
commonFields["TAX_ID"] = "95-1622945";

module.exports = commonFields;