//it converts the name 'username.org.csr.com' to 'username'
const splitOrgName = orgFullName => orgFullName.split('.')[0];

module.exports = splitOrgName