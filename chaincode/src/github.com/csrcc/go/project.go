package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric/core/chaincode/shim"
	pb "github.com/hyperledger/fabric/protos/peer"
)

type Project struct {
	ObjectType       string            `json:"docType"`
	ProjectName      string            `json:"projectName"`
	ProjectType      string            `json:"projectType"`
	Phases           []Phase           `json:"phases"`
	CreationDate     int               `json:"creationDate"`
	TotalProjectCost float64           `json:"totalProjectCost"`
	ProjectState     string            `json:"projectState"` //Created, PartlyFunded, FullyFunded, Completed
	NGO              string            `json:"ngo"`
	Contributors     map[string]string `json:"contributors"`
}

type Phase struct {
	Qty                float64                 `json:"qty"`
	OutstandingQty     float64                 `json:"outstandingQty"`
	PhaseState         string                  `json:"phaseState"` //Created, Open For Funding, PartlyFunded, FullyFunded, Seeking Validation, Validated, Complete
	Contributions      map[string]Contribution `json:"contributions"`
	StartDate          int                     `json:"startDate"`
	EndDate            int                     `json:"endDate"`
	ValidationCriteria map[string][]Criterion  `json:"validationCriteria"`
}

type Contribution struct {
	Contributor      string  `json:"donatorAddress"`
	ContributionQty  float64 `json:"contributionQty"`
	ReviewMsg        string  `json:"reviewMsg"`
	Rating           int     `json:"rating"`
	Validated        bool    `json:"validated"`
	RejectionComment string  `json:"rejectionComment"`
}

type Criterion struct {
	Desc    string `json:"desc"`
	DocName string `json:"docName"`
	DocHash string `json:"docHash"`
}

//create a new project
func (s *SmartContract) createProject(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** createProject Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "NgoMSP" {
		logger.Info("only ngo can initiate createProject")
		return shim.Error("only ngo can initiate createProject")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	if len(args) != 3 {
		return shim.Error("Incorrect number of arguments. Expecting 3")
	} else if len(args[0]) <= 0 {
		return shim.Error("project details must be a non-empty json string")
	} else if len(args[1]) <= 0 {
		return shim.Error("pId must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return shim.Error("tx Id must be a non-empty string")
	}

	pId := args[1]
	txId := args[2]

	projectObj := Project{}
	err = json.Unmarshal([]byte(args[0]), &projectObj)

	if err != nil {
		return shim.Error("error in unmarshalling: " + err.Error())
	} else if len(projectObj.ProjectName) <= 0 {
		return shim.Error("Project name is mandatory!")
	} else if len(projectObj.ProjectType) <= 0 {
		return shim.Error("Project type is mandatory!")
	} else if len(projectObj.Phases) < 1 {
		return shim.Error("please specify atleast one phase!")
	} else if projectObj.CreationDate <= 0 {
		return shim.Error("Creation Date is mandatory!")
	} else if projectObj.TotalProjectCost <= 0 {
		return shim.Error("Total Project Cost is mandatory!")
	} else if projectObj.Contributors != nil {
		return shim.Error("Contributors should be none!")
	}

	projInBytes, _ := APIstub.GetState(pId)
	if projInBytes != nil {
		return shim.Error("Project with this pId already exists")
	}

	//check if project with same name already exists.
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"Project\", \"projectName\":\"%s\"}}", projectObj.ProjectName)
	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	} else if len(queryResults) > 2 {
		return shim.Error("A project with the same name already exists!")
	}

	//set extra attributes
	projectObj.NGO = commonName
	projectObj.ObjectType = "Project"
	projectObj.ProjectState = "Created"
	projectObj.Contributors = make(map[string]string)

	//TODO: move it to UI
	allPhaseCosts := 0.0
	for i := 0; i < len(projectObj.Phases); i++ {
		projectObj.Phases[i].PhaseState = "Created"
		projectObj.Phases[i].OutstandingQty = projectObj.Phases[i].Qty
		allPhaseCosts += projectObj.Phases[i].Qty
		if projectObj.Phases[i].Contributions != nil {
			return shim.Error("No phase contributions expected!")
		}
		projectObj.Phases[i].Contributions = make(map[string]Contribution)
		if projectObj.Phases[i].ValidationCriteria == nil {
			return shim.Error("Please provide atleast one validation criteria!")
		}
	}

	projectObj.Phases[0].PhaseState = "Open For Funding"

	if allPhaseCosts != projectObj.TotalProjectCost {
		return shim.Error("sum of all phase costs do not match with total project cost!")
	}

	newProjAsBytes, err := json.Marshal(projectObj)
	if err != nil {
		return shim.Error("Json convert error" + err.Error())
	}

	err = APIstub.PutState(pId, newProjAsBytes)
	if err != nil {
		return shim.Error("error saving project" + err.Error())
	}

	err = createTransaction(APIstub, commonName, "All", projectObj.TotalProjectCost, projectObj.CreationDate, "ProjectCreate", pId, txId, -1)
	if err != nil {
		return shim.Error("Failed to add a Tx: " + err.Error())
	}

	logger.Info("*************** createProject Successful ***************")
	return shim.Success(nil)
}

//validate/invalidate a phase
func (s *SmartContract) validatePhase(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** validatePhase Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CorporateMSP" {
		logger.Info("only corporate can initiate validatePhase")
		return shim.Error("only corporate can initiate validatePhase")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	if len(args) != 6 {
		return shim.Error("Incorrect number of arguments. Expecting 6")
	} else if len(args[0]) <= 0 {
		return shim.Error("project id must be a non-empty json string")
	} else if len(args[1]) <= 0 {
		return shim.Error("phase No. must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return shim.Error("validation must be a non-empty string")
	} else if len(args[4]) <= 0 {
		return shim.Error("date must be a non-empty string")
	} else if len(args[5]) <= 0 {
		return shim.Error("tx Id must be a non-empty string")
	}

	projectId := args[0]
	phaseNumber, err := strconv.Atoi(args[1])
	if err != nil {
		return shim.Error(err.Error())
	}
	validated, err := strconv.ParseBool(args[2])
	if err != nil {
		return shim.Error(err.Error())
	}
	rejectionComment := args[3]
	date, err := strconv.Atoi(args[4])
	if err != nil {
		return shim.Error(err.Error())
	}
	txId := args[5]

	projectInBytes, _ := APIstub.GetState(projectId)
	if projectInBytes == nil {
		return shim.Error("Project doesn't exist")
	}

	projectObj := Project{}
	err = json.Unmarshal(projectInBytes, &projectObj)
	if err != nil {
		return shim.Error("error in unmarshalling: " + err.Error())
	}

	if !(phaseNumber >= 0 && phaseNumber < len(projectObj.Phases)) {
		return shim.Error("Invalid phase number!")
	} else if projectObj.Phases[phaseNumber].Contributions[commonName].ContributionQty == 0.0 {
		return shim.Error("Invalid contributor cannot validate the phase!")
	} else if projectObj.Phases[phaseNumber].PhaseState != "Fully Funded" && projectObj.Phases[phaseNumber].PhaseState != "Seeking Validation" {
		return shim.Error("The phase must be in fully funded state only!")
	} else if validated == false && len(rejectionComment) == 0 {
		return shim.Error("Rejection comments are mandatory!")
	}

	contributionObj := projectObj.Phases[phaseNumber].Contributions[commonName]
	contributionObj.Validated = validated
	contributionObj.RejectionComment = rejectionComment
	projectObj.Phases[phaseNumber].Contributions[commonName] = contributionObj

	//calculate total qty of validated contributions
	qtyReceived := 0.0
	noOfCorporates := 0
	for _, v := range projectObj.Phases[phaseNumber].Contributions {
		if v.Validated == true {
			qtyReceived += v.ContributionQty
			noOfCorporates += 1
		}
	}

	//if mejority contributions received and mejority no. of contributors have validated, then the phase becomes Validated
	if (qtyReceived > (projectObj.Phases[phaseNumber].Qty)/2) && (noOfCorporates >= (len(projectObj.Phases[phaseNumber].Contributions)/2)+1) {
		projectObj.Phases[phaseNumber].PhaseState = "Validated"
	} else {
		projectObj.Phases[phaseNumber].PhaseState = "Seeking Validation"
	}

	newProjAsBytes, err := json.Marshal(projectObj)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = APIstub.PutState(projectId, newProjAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = createTransaction(APIstub, commonName, projectObj.NGO, 0.0, date, "Project_PhaseValidation", projectId, txId, phaseNumber)
	if err != nil {
		return shim.Error(err.Error())
	}

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := "Phase " + strconv.Itoa(phaseNumber+1) + " of project " + projectObj.ProjectName + " has been "
	if len(rejectionComment) > 1 {
		eventPayload += "rejected by "
	} else {
		eventPayload += "validated by "
	}
	eventPayload += splitName[0] + "."

	notification := &Notification{TxId: txId, Description: eventPayload, Users: []string{projectObj.NGO}}
	logger.Info("notification:", eventPayload)
	notificationtAsBytes, err := json.Marshal(notification)
	APIstub.SetEvent("Notification", notificationtAsBytes)

	logger.Info("*************** validatePhase Successful ***************")
	return shim.Success(nil)
}

//add new/more validation criteria
// func (s *SmartContract) addValidationCriteria(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
// 	logger.Info("*************** addValidationCriteria Started ***************")
// 	logger.Info("args received: ", args)

// 	//getusercontext to prepopulate the required data
// 	creator, err := APIstub.GetCreator()
// 	if err != nil {
// 		return shim.Error("Error getting transaction creator: " + err.Error())
// 	}
// 	mspId, commonName, _ := getTxCreatorInfo(creator)
// 	// if mspId != "CorporateMSP" {
// 	// 	fmt.Errorf("only corporate can initiate addValidationCriteria")
// 	// 	return shim.Error("only corporate can initiate addValidationCriteria")
// 	// }
// 	logger.Info("current logged in user :", commonName, " with mspId :", mspId)

// 	if len(args) != 6 {
// 		return shim.Error("Incorrect number of arguments. Expecting 6")
// 	} else if len(args[0]) <= 0 {
// 		return shim.Error("project id must be a non-empty json string")
// 	} else if len(args[1]) <= 0 {
// 		return shim.Error("phase No. must be a non-empty string")
// 	} else if len(args[2]) <= 0 {
// 		return shim.Error("validation must be a non-empty string")
// 	} else if len(args[4]) <= 0 {
// 		return shim.Error("date must be a non-empty string")
// 	} else if len(args[5]) <= 0 {
// 		return shim.Error("tx Id must be a non-empty string")
// 	}

// 	newProjAsBytes, err := json.Marshal(projectObj)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}

// 	err = APIstub.PutState(projectId, newProjAsBytes)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}

// 	err = createTransaction(APIstub, commonName, projectObj.NGO, 0.0, date, "Project_PhaseValidation", projectId, txId)
// 	if err != nil {
// 		return shim.Error(err.Error())
// 	}

// 	logger.Info("*************** addValidationCriteria Successful ***************")
// 	return shim.Success(nil)
// }

//update the validation criteria to add uploaded document hashes
func (s *SmartContract) addDocumentHash(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** addDocumentHash Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "NgoMSP" {
		logger.Info("only ngo can initiate addDocumentHash")
		return shim.Error("only ngo can initiate addDocumentHash")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	if len(args) != 7 {
		return shim.Error("Incorrect number of arguments. Expecting 7")
	} else if len(args[0]) <= 0 {
		return shim.Error("project id must be a non-empty json string")
	} else if len(args[1]) <= 0 {
		return shim.Error("phase No. must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return shim.Error("criterion must be a non-empty string")
	} else if len(args[3]) <= 0 {
		return shim.Error("doc hash must be a non-empty string")
	} else if len(args[4]) <= 0 {
		return shim.Error("doc name must be a non-empty string")
	} else if len(args[5]) <= 0 {
		return shim.Error("date must be a non-empty string")
	} else if len(args[6]) <= 0 {
		return shim.Error("tx Id must be a non-empty string")
	}

	projectId := args[0]
	phaseNumber, err := strconv.Atoi(args[1])
	if err != nil {
		return shim.Error(err.Error())
	}
	criterion := args[2]
	docHash := args[3]
	docName := args[4]
	date, err := strconv.Atoi(args[5])
	if err != nil {
		return shim.Error(err.Error())
	}
	txId := args[6]

	projectInBytes, _ := APIstub.GetState(projectId)
	if projectInBytes == nil {
		return shim.Error("Project doesn't exist")
	}

	projectObj := Project{}
	err = json.Unmarshal(projectInBytes, &projectObj)
	if err != nil {
		return shim.Error("error in unmarshalling: " + err.Error())
	}

	//save the docHash
	if projectObj.Phases[phaseNumber].PhaseState == "Validated" {
		return shim.Error("Documents cant be uploaded to a validated phase!")
	} else if projectObj.Phases[phaseNumber].ValidationCriteria[criterion] == nil {
		return shim.Error("No such criteria exists!")
	}

	projectObj.Phases[phaseNumber].ValidationCriteria[criterion] = append(projectObj.Phases[phaseNumber].ValidationCriteria[criterion], Criterion{"desc", docName, docHash})

	newProjAsBytes, err := json.Marshal(projectObj)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = APIstub.PutState(projectId, newProjAsBytes)
	if err != nil {
		return shim.Error(err.Error())
	}

	err = createTransaction(APIstub, commonName, projectObj.NGO, 0.0, date, "UploadDocument", projectId, txId, phaseNumber)
	if err != nil {
		return shim.Error(err.Error())
	}

	tmpList := make([]string, 0, len(projectObj.Phases[phaseNumber].Contributions))
	for k := range projectObj.Phases[phaseNumber].Contributions {
		tmpList = append(tmpList, k)
	}

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has uploaded a document to the phase " + strconv.Itoa(phaseNumber+1) + " of a project."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: tmpList}
	logger.Info("notification:", eventPayload)
	notificationtAsBytes, err := json.Marshal(notification)
	APIstub.SetEvent("Notification", notificationtAsBytes)

	logger.Info("*************** addDocumentHash Successful ***************")
	return shim.Success(nil)
}

/*
//add a phase
func (s *SmartContract) AddPhaseToProject(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) != 4 {
		return shim.Error("Incorrect number of arguments. Expecting 5")
	}
	//qty,from,to,projectId,ngo
	pid := strings.ToLower(args[0])
	qty, _ := strconv.Atoi(args[1])
	date, _ := strconv.Atoi(args[2])
	txId := args[3]
	//Get the existing project and add a new phase to it
	projInBytes, err := APIstub.GetState(pid)
	if err != nil {
		return shim.Error("Json Marshall error" + err.Error())
	}

	project := Project{}
	json.Unmarshal(projInBytes, &project)

	newPhase := Phase{Qty: qty, PhaseState: "OpenForFunding", Contributions: []Contribution{}}
	project.Phases = append(project.Phases, newPhase)
	//save project
	newProjAsBytes, _ := json.Marshal(project)
	APIstub.PutState(pid, newProjAsBytes)

	createTransaction(APIstub, project.NGO, "", 0, date, "AddProjectPhase", txId)

	return shim.Success(nil)
}
func (s *SmartContract) AddContributorToProjectPhase(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) != 8 {
		return shim.Error("Incorrect number of arguments. Expecting 5")
	}
	pid := strings.ToLower(args[0])
	date, _ := strconv.Atoi(args[1])
	phaseId, _ := strconv.Atoi(args[2])
	qty, _ := strconv.Atoi(args[3])
	reviewMsg := args[4]
	rating, _ := strconv.Atoi(args[5])
	fromAddress := args[6]
	txId := args[7]

	projInBytes, err := APIstub.GetState(pid)
	if err != nil {
		return shim.Error("unble to find project with Pid:" + pid + err.Error())
	}

	project := Project{}
	json.Unmarshal(projInBytes, &project)

	newContribution := Contribution{Contributor: fromAddress, ContributionQty: qty, ReviewMsg: reviewMsg, Rating: rating}
	project.Phases[phaseId].Contributions = append(project.Phases[phaseId].Contributions, newContribution)

	newProjAsBytes, _ := json.Marshal(project)
	APIstub.PutState(pid, newProjAsBytes)

	createTransaction(APIstub, project.NGO, "", 0, date, "AddContributor", txId)

	return shim.Success(nil)
}
func (s *SmartContract) UpdateProjectDetails(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {

	if len(args) != 7 {
		return shim.Error("Incorrect number of arguments. Expecting 5")
	}
	//qty,from,to,projectId,ngo
	pName := args[0]
	pType := strings.ToLower(args[1])
	qty, _ := strconv.Atoi(args[2])
	pid := strings.ToLower(args[3])
	ngo := strings.ToLower(args[4])
	date, _ := strconv.Atoi(args[5])
	txId := args[6]

	projInBytes, err := APIstub.GetState(pid)
	if err != nil {
		return shim.Error("Json Marshall error" + err.Error())
	}
	proj := Project{}

	json.Unmarshal(projInBytes, &proj)

	proj.ProjectName = pName
	proj.ProjectType = pType

	projAsBytes, err := json.Marshal(proj)

	if err != nil {
		return shim.Error("Json convert error" + err.Error())
	}

	err = APIstub.PutState(pid, projAsBytes)

	if err != nil {
		return shim.Error("error saving project" + err.Error())
	}

	createTransaction(APIstub, ngo, "", qty, date, "ProjectDetailsUpdated", txId)

	return shim.Success(nil)
}
*/

//get all projects and projectsByOrg
//for ca - get all projects
//for ngo - get all projects created by the ngo
//for corporate - get all ongoing projects where he has contributed
func (s *SmartContract) queryAllProjects(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** queryAllProjects Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}

	mspId, commonName, _ := getTxCreatorInfo(creator)
	queryString := ""

	if len(args) != 1 {
		return shim.Error("an argument is expected!")
	} else if args[0] == "true" || mspId == "CreditsAuthorityMSP" {
		queryString = fmt.Sprintf("{\"selector\":{\"docType\":\"Project\"}}")
	} else if mspId == "NgoMSP" {
		queryString = fmt.Sprintf("{\"selector\":{\"docType\":\"Project\", \"ngo\":\"%s\"}}", commonName)
	} else if mspId == "CorporateMSP" {
		commonName = strings.ReplaceAll(commonName, ".", "\\\\.")
		queryString = fmt.Sprintf("{\"selector\":{\"docType\":\"Project\", \"contributors\":{\"%s\": \"exists\"}, \"projectState\": {\"$ne\": \"Fully Funded\"}}}", commonName)
	} else {
		return shim.Error("Unauthorized org!")
	}

	queryResults, err := getQueryResultForQueryString(APIstub, queryString)
	if err != nil {
		return shim.Error(err.Error())
	}

	logger.Info("*************** queryAllProjects Successful ***************")
	return shim.Success(queryResults)
}

//update the project/phase state
func (s *SmartContract) updateProject(APIstub shim.ChaincodeStubInterface, args []string) pb.Response {
	logger.Info("*************** updateProject Started ***************")
	logger.Info("args received:", args)

	//getusercontext to populate the required data
	creator, err := APIstub.GetCreator()
	if err != nil {
		return shim.Error("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "NgoMSP" {
		logger.Info("only ngo can initiate ReserveFundsForProject")
		return shim.Error("only ngo can initiate ReserveFundsForProject")
	}
	logger.Info("current logged in user:", commonName, "with mspId:", mspId)

	projectId := strings.ToLower(args[0])
	phaseNumber, _ := strconv.Atoi(args[1])
	state := args[2]
	date, err := strconv.Atoi(args[3])
	if err != nil {
		return shim.Error("date should be numeric.")
	}
	txId := args[4]

	projectState := Project{}

	//check if the project exists
	projectAsBytes, err := APIstub.GetState(projectId)
	if err != nil {
		return shim.Error("Error getting project")
	}
	if projectAsBytes == nil {
		logger.Info("project with id:", projectId, "not present")
		return shim.Error("project is not present")
	}
	json.Unmarshal(projectAsBytes, &projectState)

	//check for the validity of the phase number
	if phaseNumber >= len(projectState.Phases) {
		logger.Info("Invalid phase number")
		return shim.Error("invalid phase number")
	}

	if state == "Open For Funding" {
		if projectState.Phases[phaseNumber].PhaseState == "Created" {
			projectState.Phases[phaseNumber].PhaseState = "Open For Funding"
		} else {
			logger.Info("Only created state can be opened for funding")
			return shim.Error("Only created state can be opened for funding")
		}
		if phaseNumber > 0 {
			if projectState.Phases[phaseNumber-1].PhaseState != "Complete" {
				logger.Info("previous phase is not Complete")
				return shim.Error("previous phase is not Complete")
			}
		}
	} else if state == "Complete" {
		if projectState.Phases[phaseNumber].PhaseState == "Validated" {
			projectState.Phases[phaseNumber].PhaseState = "Complete"
		} else {
			logger.Info("current phase is not yet validated to be marked complete")
			return shim.Error("current phase is not yet validated to be marked complete")
		}
		if phaseNumber == len(projectState.Phases)-1 {
			projectState.ProjectState = "Completed"
		}
	} else {
		logger.Info("state can be Open For Funding or Complete")
		return shim.Error("state can be Open For Funding or Complete")
	}

	projectAsBytes, _ = json.Marshal(projectState)
	APIstub.PutState(projectId, projectAsBytes)

	//create a transaction
	err = createTransaction(APIstub, commonName, "All", 0.0, date, "UpdateProject", projectId, txId, phaseNumber)
	if err != nil {
		return shim.Error("Failed to add a Tx: " + err.Error())
	}

	//list of users who will receive the notification.
	tmpList := make([]string, 0, len(projectState.Phases[phaseNumber].Contributions))
	for k := range projectState.Phases[phaseNumber].Contributions {
		tmpList = append(tmpList, k)
	}

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has updated the phase " + strconv.Itoa(phaseNumber+1) + " of project " + projectState.ProjectName + "."

	if state == "Open For Funding" {
		//get all corporates who have locked credits for this project.
		//notification will be sent to only these corporates.
		queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"EscrowDetails\", \"project\": \"%s\"}, \"fields\": [\"corporate\"]}", projectId)
		queryResults, err := getQueryResultForQueryString(APIstub, queryString)
		if err != nil {
			return shim.Error(err.Error())
		}
		logger.Info("query result:", string(queryResults))

		var result []map[string]interface{}
		err = json.Unmarshal([]byte(queryResults), &result)

		corpsList := make([]string, 0, len(result)) 
		for _, value := range result {
			corpName := value["Record"].(map[string]interface{})["corporate"].(string)
			corpsList = append(corpsList, corpName)
		}
		tmpList = corpsList
		eventPayload = "Phase " + strconv.Itoa(phaseNumber+1) + " of project " + projectState.ProjectName + " is open for funding."
	}

	notification := &Notification{TxId: txId, Description: eventPayload, Users: tmpList}
	logger.Info("notification:", eventPayload)
	notificationtAsBytes, err := json.Marshal(notification)
	APIstub.SetEvent("Notification", notificationtAsBytes)

	logger.Info("*************** updateProject Successful ***************")
	return shim.Success(nil)
}
