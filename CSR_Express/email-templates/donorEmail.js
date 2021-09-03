require('dotenv').config();
const { PLATFORM_NAME, PLATFORM_HASHTAG } = process.env;
module.exports ={
    donorEmail:(firstName,amount,projectName,platformName,date,address)=>{
        if(firstName ==='Guest'){
            return `<!DOCTYPE html>
            <html style="height:100%;">
                <head>
                    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
                    <meta name="viewport" content="width=device-width"/>
                    <title></title>
                </head>
                <body>
                <div>
                    <div margin-top: 10px; margin-right: 10px; margin-left: 10px;>
                    <br>
                    <br>
    
                    <p>Hi,</p><br>
                    <p>Thank you for your recent donation to ${PLATFORM_NAME} in support of the project “${projectName}.” </p>
            
            <p>We received your donation of <b>$${amount} USD</b> on <b>${date}</b>.</p>
            
            <p>Rainforest Foundation US, administering contributions made to ${PLATFORM_NAME} is a 501(c)(3) non-profit organization with tax identification number 95-1622945. Your gift is fully tax deductible; no goods and/or services were provided to you in exchange for this donation. Please keep this as a receipt of your donation.</p>
            
            <p>Please consider sharing the news on social media using #${PLATFORM_HASHTAG} and tell others why donating through this platform was important to you.</p>
            
            <p>What’s next?</p>
            
            <p>You’ll be notified when the project ${projectName} begins activities. Stay tuned! Your climate action is officially in progress.</p>
            
            <p>Thank you again for taking a clear stand for the forests, their peoples, and the planet.</p>
            
            <p>If you have any questions or feedback for us, please email blockchain@rffny.org</p>
            
            <p>With gratitude,</p>
            <p>${PLATFORM_NAME} Team</p>
            
                    </div>   
                </div>
                </body>
            </html>`
        }
        else{
            let addressHtml='';
            if((address.zipCode !='' && address.city !='' && address.state != '')){
            addressHtml=`<div margin-top: 10px; margin-right: 10px; margin-left: 10px;>
            <p>${firstName}</p>
            <p>${address.addressLine1}</p>
            <p>${address.addressLine2}</p>
            <p>${address.city+', '+address.state+', '+address.zipCode}</p><br>`
            }
            return `<!DOCTYPE html>
            <html style="height:100%;">
            <head>
            <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
            <meta name="viewport" content="width=device-width"/>
            <title></title>
            </head>
            <body>
            <div>
            ${addressHtml}

                <p>Dear <b>${firstName}</b>,</p><br>
                <p>Thank you for your recent donation to ${PLATFORM_NAME} in support of the project “${projectName}.” </p>
        
        <p>We received your donation of <b>$${amount} USD</b> on <b>${date}</b>.</p>
        
        <p>Rainforest Foundation US, administering contributions made to ${PLATFORM_NAME} is a 501(c)(3) non-profit organization with tax identification number 95-1622945. Your gift is fully tax deductible; no goods and/or services were provided to you in exchange for this donation. Please keep this as a receipt of your donation.</p>
        
        <p>Please consider sharing the news on social media using #${PLATFORM_HASHTAG} and tell others why donating through this platform was important to you.</p>
        
        <p>What’s next?</p>
        
        <p>You’ll be notified when the project ${projectName} begins activities. Stay tuned! Your climate action is officially in progress.</p>
        
        <p>${firstName}, thank you again for taking a clear stand for the forests, their peoples, and the planet.</p>
        
        <p>If you have any questions or feedback for us, please email blockchain@rffny.org</p>
        
        <p>With gratitude,</p>
        <p>${PLATFORM_NAME} Team</p>
        
                </div>   
            </div>
            </body>
        </html>`

        }
    }
}