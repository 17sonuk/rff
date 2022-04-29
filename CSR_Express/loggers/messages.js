const messages = {
	error: {
		//userservice
		DB_CONNECT: 'Database connection issue! Please report',
		BAD_CONNECTION: 'Bad Connection',
		INVALID_EMAIL: 'Email is missing/invalid format',
		INVALID_SEEN: 'Seen is an invalid field',
		INVALID_FIRST_NAME: 'First name is missing/invalid',
		FIRST_NAME_LENGTH: 'First name cannot exceed 50 characters',
		INVALID_LAST_NAME: 'Last name is missing/invalid',
		LAST_NAME_LENGTH: 'Last name cannot exceed 50 characters',
		INVALID_ORG_NAME: 'Organisation name is invalid',
		INVALID_USER_NAME: 'User name is missing/invalid',
		USER_NAME_LENGTH: 'User name cannot exceed 50 characters',
		INVALID_DONOR_TYPE: 'Donor type is missing/invalid',
		INVALID_COMPANY_NAME: 'Company/Foundation/Fund Name is missing/invalid',
		INVALID_ADDRESS: 'Address data is missing/invalid',
		INVALID_BANK_ADDRESS: 'Bank address is missing/invalid',
		MISSING_PAYMENT_DETAILS: 'Payment details are missing',
		MISSING_PAYPAL_ID: 'Paypal email id is missing',
		MISSING_CRYPTO_ID: 'Crypto id is missing',
		MISSING_BANK_DETAILS: 'Bank details are missing',
		PENDING_APPROVAL: 'Pending for approval. Please try again later',
		USER_EXISTS: 'User already exists',
		INVALID_USER: 'User does not exist',
		UNAUTHORIZED_USER: 'Unauthorized user',
		INVALID_UPDATE_FIELDS: 'These fields cannot be updated: Email, User Name, Organisation Name, Status, Seen',
		INVALID_INDIVIDUAL_DATA: 'Individual Donor cannot have Website, Payment Details',
		INVALID_INSTITUTIONAL_DATA: 'Institution Donor cannot have Payment Details',
		INVALID_NGO_DATA: 'Beneficiary cannot add a Website',
		INVALID_PHONE_DETAILS: 'Phone details are missing/invalid',
		MISSING_PAYMENT_MODE: 'Please select a payment mode',
		INVALID_PAYMENT_MODE: 'Invalid payment mode',
		FAILED_UPDATE_USER: 'Failed to update profile. Please Try again',
		TRY_AGAIN: 'Something went wrong. Please try again',
		RESET_USER: 'Could not reset user status',

		//project
		FAILED_PROJECT_APPROVAL: 'Failed to approve project',
		FAILED_EDIT_PROJECT: 'Failed to edit project',
		NO_RECORDS: 'No records found',
		DB_ERROR: 'Received error from database',
		NO_PROJECT: 'No project found',
		INVALID_PROJECT_ID: 'Project ID does not exist',
		PROJECT_ID: 'Project ID already exists',

		INVALID_CONTRIBUTOR: 'Contributor already exist',
		FAILED_PROJECT_DELETE: 'Failed to delete project in mongo DB',
		APPROVED_PROJECT_EDIT: 'Only approved project is allowed to edit',
		INVALID_PHASE_NUMBER: 'Cannot find current phaseNumber',

		//common
		NO_COMMUNITY: 'Community not found or does not exist',
		NO_DATA: 'No data found',
		DONOR_EXIST: 'Donor already exists',
		MONGO_ERROR: 'Failed to connect to mongo DB',

		//user
		FAILED_REGISTER_USER: 'Couldn\'t register user in blockchain! Please report',

		//file
		UPLOAD_FILE: 'Please upload a file',
		INVALID_FILE: 'File size limit exceeded or Invalid file type/format or Corrupted file',

		//utils
		REPORT_TYPE: 'Report type should be json or excel',

		//redeem
		UNAUTHORISED_REDEEM_ACCESS: 'Unauthorised access to redeem request',
		NGO_OR_COMMUNITY: 'Select either ngo or community',
		NGO_AND_COMMUNITY: 'Both ngo and community cannot be selected',

		//token
		PENDING_FUNDS_APPROVAL: 'Request is pending with Rainforest US. Please wait to receive funds in your wallet.',
		ERROR: 'Some error occured',
		ADD_CONTRIBUTOR_FAILURE: 'Failed to add contributor in mongo DB',
		SAVE_DONOR_ERROR: 'Failed to save donor details',
		SEND_EMAIL_ERROR: 'Failed to send email to donor'
	},

	success: {
		//user
		NOTIFICATION_CREATED: 'Notification is created in DB',
		TRANSACTION_DESCRIPTION: 'Transaction description is created in DB',
		NOTIFICATION_UPDATED: 'Notification updated',
		UPDATE_USER: 'User profile updated successfully',

		//project
		PROJECT_CREATED: 'Project created in DB',
		PROJECT_EDIT: 'Project edited successfully',
		PROJECT_APPROVAL: 'Project approved successfully',
		PROJECT_DELETE: 'Project deleted successfully',
		ADD_CONTRIBUTOR: 'Contributor added successfully',

		//user
		REGISTER_USER: 'User registered successfully',

		//redeem
		INVOKE_REDEEM: 'Successfully invoked Redeem Request',
		INVOKE_APPROVE_REDEEM: 'Successfully invoked Approve Redeem Request',
		INVOKE_REJECT_REDEEM: 'Successfully invoked Reject Redeem Request',

		//token
		CREDIT_FUNDS: 'Funds credited successfully',
		TRANSFER_SUCCESS: 'Transferred succesfully',

		//blockchain project router
		INVOKE_CREATE_PROJECT: 'Successfully invoked Create Project',
		INVOKE_UPDATE_PROJECT: 'Successfully invoked Update Project',
		ABANDON_PROJECT: 'Abandoned project successfully',
		VALIDATE_PHASE: 'Phase is validated successfully',
		INVOKE_DOCUMENT_HASH: 'Successfully invoked Add Document Hash',
		PROJECT_INITIATED: 'Project has been initiated and donors have been notified',
		//save project
		PROJECT_UPDATE: 'Project updated successfully'

	}
}
module.exports = messages;