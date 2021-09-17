const messages = {
	error : {
		//userservice
		DB_CONNECT: 'Database connection issue! Please report',
		BAD_CONNECTION:'Bad Connection',
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
		INVALID_ADDRESS: 'Address data is missing/invalid for NGO',
		INVALID_BANK_ADDRESS: 'Bank address is missing/invalid for NGO',
		MISSING_PAYMENT_DETAILS: 'Payment details are missing for NGO',
		MISSING_PAYPAL_ID: 'Paypal email id is missing for NGO',
		MISSING_CRYPTO_ID: 'Crypto id is missing for NGO',
		MISSING_BANK_DETAILS: 'Bank details are missing for NGO',
		PENDING_APPROVAL: 'Pending for approval. Please try again later',
		
		INVALID_USER:'User does not exist',
		INVALID_UPDATE_FIELDS:'These fields cannot be updated: Email, User Name, Organisation Name, Status, Seen',
		INVALID_INDIVIDUAL_DATA:'Individual Donor can not have Website, Payment Details',
		INVALID_INSTITUTIONAL_DATA:'Institution Donor can not have Payment Details',
		INVALID_NGO_DATA:'Beneficiary can not have Website',
		INCOMPLETE_ADDRESS:'Some address fields are empty',
		INCOMPLETE_PHONE:'Some phone fields are empty',
		MISSING_PAYMENT_MODE:'Please select a payment mode',
		INVALID_PAYMENT_MODE:'Invalid payment mode',
		FAILED_UPDATE:'Failed to update Profile Please Try again',
		TRY_AGAIN:'Something went wrong please try again',

		//projectService
		PROJECT_APPROVAL:'Approval failed!',
		EDIT_PROJECT:'Edit failed!',
		NO_RECORDS:'No records found',

		//commonService
		NO_COMMUNITY:'No community',
		NO_DATA:'No data found',
		NO_PROJECT:'No project found',
		//userroute
		FAILED_REGISTER_USER:'Couldn\'t register user in blockchain! Please report',
		//filerouter
		INVALID_FILE:'File size limit exceed or Invalid file type or Corrupted File'

	},

	success : {
		//userservice
		NotificationCreated:'notification created in db',
		TxDescriptionCreated:'tx description created in db',
		NotificationUpdated:'notification updated',
		UpdateUserProfile:'User Profile Updated Successfully',

		//projectservice
		ProjectCreated:'project created in db',

		//commonService
		UploadBalanceSheet:'balance Sheet uploaded successfully',
		//userroute
		RegisterUser:'User onboarded successfully!',

	}
}
module.exports = messages;