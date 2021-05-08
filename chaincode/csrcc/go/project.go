package main

import (
	"encoding/json"
	"fmt"
	"strconv"
	"strings"

	"github.com/hyperledger/fabric-contract-api-go/contractapi"
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
	VisibleTo        []string          `json:"visibleTo"`
	NoOfUpdates      uint8             `json:"noOfUpdates"`
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
func (s *SmartContract) CreateProject(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** createProject Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "NgoMSP" {
		InfoLogger.Printf("only ngo can initiate createProject")
		return false, fmt.Errorf("only ngo can initiate createProject")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 3 {
		return false, fmt.Errorf("Incorrect number of arguments. Expecting 3")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("project details must be a non-empty json string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("pId must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("tx Id must be a non-empty string")
	}

	pId := args[1]
	txId := args[2]

	projectObj := Project{}
	err = json.Unmarshal([]byte(args[0]), &projectObj)

	if err != nil {
		return false, fmt.Errorf("error in unmarshalling: " + err.Error())
	} else if len(projectObj.ProjectName) <= 0 {
		return false, fmt.Errorf("Project name is mandatory!")
	} else if len(projectObj.ProjectType) <= 0 {
		return false, fmt.Errorf("Project type is mandatory!")
	} else if len(projectObj.Phases) < 1 {
		return false, fmt.Errorf("please specify atleast one phase!")
	} else if projectObj.CreationDate <= 0 {
		return false, fmt.Errorf("Creation Date is mandatory!")
	} else if projectObj.TotalProjectCost <= 0 {
		return false, fmt.Errorf("Total Project Cost is mandatory!")
	} else if projectObj.Contributors != nil {
		return false, fmt.Errorf("Contributors should be none!")
	}

	projInBytes, _ := ctx.GetStub().GetState(pId)
	if projInBytes != nil {
		return false, fmt.Errorf("Project with this pId already exists")
	}

	//check if project with same name already exists.
	queryString := fmt.Sprintf("{\"selector\":{\"docType\":\"Project\", \"projectName\":\"%s\"}}", projectObj.ProjectName)
	queryResults, err := GetQueryResultForQueryString(ctx, queryString)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	} else if len(queryResults) > 2 {
		return false, fmt.Errorf("A project with the same name already exists!")
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

		if projectObj.Phases[i].StartDate >= projectObj.Phases[i].EndDate {
			return false, fmt.Errorf("end date must be ahead of start date!")
		}
		if projectObj.Phases[i].Contributions != nil {
			return false, fmt.Errorf("No phase contributions expected!")
		}
		projectObj.Phases[i].Contributions = make(map[string]Contribution)
		if projectObj.Phases[i].ValidationCriteria == nil {
			return false, fmt.Errorf("Please provide atleast one validation criteria!")
		}
	}

	projectObj.Phases[0].PhaseState = "Open For Funding"

	if allPhaseCosts != projectObj.TotalProjectCost {
		return false, fmt.Errorf("sum of all phase costs do not match with total project cost!")
	}

	newProjAsBytes, err := json.Marshal(projectObj)
	if err != nil {
		return false, fmt.Errorf("Json convert error" + err.Error())
	}

	err = ctx.GetStub().PutState(pId, newProjAsBytes)
	if err != nil {
		return false, fmt.Errorf("error saving project" + err.Error())
	}

	err = createTransaction(ctx, commonName, "All", projectObj.TotalProjectCost, projectObj.CreationDate, "ProjectCreate", pId, txId, -1)
	if err != nil {
		return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
	}

	InfoLogger.Printf("*************** createProject Successful ***************")
	return true, nil
}

//validate/invalidate a phase
func (s *SmartContract) ValidatePhase(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** validatePhase Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "CorporateMSP" {
		InfoLogger.Printf("only corporate can initiate validatePhase")
		return false, fmt.Errorf("only corporate can initiate validatePhase")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 6 {
		return false, fmt.Errorf("Incorrect number of arguments. Expecting 6")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("project id must be a non-empty json string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("phase No. must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("validation must be a non-empty string")
	} else if len(args[4]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[5]) <= 0 {
		return false, fmt.Errorf("tx Id must be a non-empty string")
	}

	projectId := args[0]
	phaseNumber, err := strconv.Atoi(args[1])
	if err != nil || phaseNumber < 0.0 {
		return false, fmt.Errorf("Invalid phase number!")
	}
	validated, err := strconv.ParseBool(args[2])
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}
	rejectionComment := args[3]
	date, err := strconv.Atoi(args[4])
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}
	txId := args[5]

	projectInBytes, _ := ctx.GetStub().GetState(projectId)
	if projectInBytes == nil {
		return false, fmt.Errorf("Project doesn't exist")
	}

	projectObj := Project{}
	err = json.Unmarshal(projectInBytes, &projectObj)
	if err != nil {
		return false, fmt.Errorf("error in unmarshalling: " + err.Error())
	}

	if !(phaseNumber >= 0 && phaseNumber < len(projectObj.Phases)) {
		return false, fmt.Errorf("Invalid phase number!")
	} else if projectObj.Phases[phaseNumber].Contributions[commonName].ContributionQty == 0.0 {
		return false, fmt.Errorf("Invalid contributor cannot validate the phase!")
	} else if projectObj.Phases[phaseNumber].PhaseState != "Fully Funded" && projectObj.Phases[phaseNumber].PhaseState != "Seeking Validation" {
		return false, fmt.Errorf("The phase must be in fully funded state only!")
	} else if validated == false && len(rejectionComment) == 0 {
		return false, fmt.Errorf("Rejection comments are mandatory!")
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
		return false, fmt.Errorf(err.Error())
	}

	err = ctx.GetStub().PutState(projectId, newProjAsBytes)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	err = createTransaction(ctx, commonName, projectObj.NGO, 0.0, date, "Project_PhaseValidation", projectId, txId, phaseNumber)
	if err != nil {
		return false, fmt.Errorf(err.Error())
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
	InfoLogger.Printf("notification:", eventPayload)
	notificationtAsBytes, err := json.Marshal(notification)
	ctx.GetStub().SetEvent("Notification", notificationtAsBytes)

	InfoLogger.Printf("*************** validatePhase Successful ***************")
	return true, nil
}

//update the validation criteria to add uploaded document hashes
func (s *SmartContract) AddDocumentHash(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** addDocumentHash Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "NgoMSP" {
		InfoLogger.Printf("only ngo can initiate addDocumentHash")
		return false, fmt.Errorf("only ngo can initiate addDocumentHash")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 7 {
		return false, fmt.Errorf("Incorrect number of arguments. Expecting 7")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("project id must be a non-empty json string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("phase No. must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("criterion must be a non-empty string")
	} else if len(args[3]) <= 0 {
		return false, fmt.Errorf("doc hash must be a non-empty string")
	} else if len(args[4]) <= 0 {
		return false, fmt.Errorf("doc name must be a non-empty string")
	} else if len(args[5]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[6]) <= 0 {
		return false, fmt.Errorf("tx Id must be a non-empty string")
	}

	projectId := args[0]
	phaseNumber, err := strconv.Atoi(args[1])
	if err != nil || phaseNumber < 0.0 {
		return false, fmt.Errorf("Invalid phase number!")
	}
	criterion := args[2]
	docHash := args[3]
	docName := args[4]
	date, err := strconv.Atoi(args[5])
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}
	txId := args[6]

	projectInBytes, _ := ctx.GetStub().GetState(projectId)
	if projectInBytes == nil {
		return false, fmt.Errorf("Project doesn't exist")
	}

	projectObj := Project{}
	err = json.Unmarshal(projectInBytes, &projectObj)
	if err != nil {
		return false, fmt.Errorf("error in unmarshalling: " + err.Error())
	}

	if projectObj.NGO != commonName {
		InfoLogger.Printf("Invalid project owner: ", commonName)
		return false, fmt.Errorf("Invalid project owner")
	}

	//save the docHash
	if projectObj.Phases[phaseNumber].PhaseState == "Validated" {
		return false, fmt.Errorf("Documents cant be uploaded to a validated phase!")
	} else if projectObj.Phases[phaseNumber].ValidationCriteria[criterion] == nil {
		return false, fmt.Errorf("No such criteria exists!")
	}

	projectObj.Phases[phaseNumber].ValidationCriteria[criterion] = append(projectObj.Phases[phaseNumber].ValidationCriteria[criterion], Criterion{"desc", docName, docHash})

	newProjAsBytes, err := json.Marshal(projectObj)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	err = ctx.GetStub().PutState(projectId, newProjAsBytes)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	err = createTransaction(ctx, commonName, projectObj.NGO, 0.0, date, "UploadDocument", projectId, txId, phaseNumber)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	tmpList := make([]string, 0, len(projectObj.Phases[phaseNumber].Contributions))
	for k := range projectObj.Phases[phaseNumber].Contributions {
		tmpList = append(tmpList, k)
	}

	splitName := strings.SplitN(commonName, ".", -1)
	eventPayload := splitName[0] + " has uploaded a document to the phase " + strconv.Itoa(phaseNumber+1) + " of a project."
	notification := &Notification{TxId: txId, Description: eventPayload, Users: tmpList}
	InfoLogger.Printf("notification:", eventPayload)
	notificationtAsBytes, err := json.Marshal(notification)
	ctx.GetStub().SetEvent("Notification", notificationtAsBytes)

	InfoLogger.Printf("*************** addDocumentHash Successful ***************")
	return true, nil
}

//update the project/phase state
func (s *SmartContract) UpdateProject(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** updateProject Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "NgoMSP" {
		InfoLogger.Printf("only ngo can initiate ReserveFundsForProject")
		return false, fmt.Errorf("only ngo can initiate ReserveFundsForProject")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	projectId := strings.ToLower(args[0])
	phaseNumber, err := strconv.Atoi(args[1])
	if err != nil || phaseNumber < 0.0 {
		return false, fmt.Errorf("Invalid phase number!")
	}
	state := args[2]
	date, err := strconv.Atoi(args[3])
	if err != nil {
		return false, fmt.Errorf("date should be numeric.")
	}
	txId := args[4]

	projectState := Project{}

	//check if the project exists
	projectAsBytes, err := ctx.GetStub().GetState(projectId)
	if err != nil {
		return false, fmt.Errorf("Error getting project")
	}
	if projectAsBytes == nil {
		InfoLogger.Printf("project with id:", projectId, "not present")
		return false, fmt.Errorf("project is not present")
	}
	json.Unmarshal(projectAsBytes, &projectState)

	if projectState.NGO != commonName {
		InfoLogger.Printf("Invalid project owner: ", commonName)
		return false, fmt.Errorf("Invalid project owner")
	}

	//check for the validity of the phase number
	if phaseNumber >= len(projectState.Phases) {
		InfoLogger.Printf("Invalid phase number")
		return false, fmt.Errorf("invalid phase number")
	}

	if state == "Open For Funding" {
		if projectState.Phases[phaseNumber].PhaseState == "Created" {
			projectState.Phases[phaseNumber].PhaseState = "Open For Funding"
		} else {
			InfoLogger.Printf("Only created state can be opened for funding")
			return false, fmt.Errorf("Only created state can be opened for funding")
		}
		if phaseNumber > 0 {
			if projectState.Phases[phaseNumber-1].PhaseState != "Complete" {
				InfoLogger.Printf("previous phase is not Complete")
				return false, fmt.Errorf("previous phase is not Complete")
			}
		}
	} else if state == "Complete" {
		if projectState.Phases[phaseNumber].PhaseState == "Validated" {
			projectState.Phases[phaseNumber].PhaseState = "Complete"
		} else {
			InfoLogger.Printf("current phase is not yet validated to be marked complete")
			return false, fmt.Errorf("current phase is not yet validated to be marked complete")
		}
		if phaseNumber == len(projectState.Phases)-1 {
			projectState.ProjectState = "Completed"
		}
	} else {
		InfoLogger.Printf("state can be Open For Funding or Complete")
		return false, fmt.Errorf("state can be Open For Funding or Complete")
	}

	projectAsBytes, _ = json.Marshal(projectState)
	ctx.GetStub().PutState(projectId, projectAsBytes)

	//create a transaction
	err = createTransaction(ctx, commonName, "All", 0.0, date, "UpdateProject", projectId, txId, phaseNumber)
	if err != nil {
		return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
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
		queryResults, err := GetQueryResultForQueryString(ctx, queryString)
		if err != nil {
			return false, fmt.Errorf(err.Error())
		}
		InfoLogger.Printf("query result:", string(queryResults))

		var result []map[string]interface{}
		err = json.Unmarshal([]byte(queryResults), &result)

		corpsList := make([]string, 0, len(result))
		for _, value := range result {
			corpName := value["Record"].(map[string]interface{})["corporate"].(string)
			InfoLogger.Printf("corpName: ", corpName)
			corpsList = append(corpsList, corpName)
		}
		tmpList = corpsList
		eventPayload = "Phase " + strconv.Itoa(phaseNumber+1) + " of project " + projectState.ProjectName + " is open for funding."
	}

	notification := &Notification{TxId: txId, Description: eventPayload, Users: tmpList}
	InfoLogger.Printf("notification:", eventPayload)
	InfoLogger.Printf(strings.Join(tmpList, " "))
	notificationtAsBytes, err := json.Marshal(notification)
	ctx.GetStub().SetEvent("Notification", notificationtAsBytes)

	InfoLogger.Printf("*************** updateProject Successful ***************")
	return true, nil
}

//added extra feature
func (s *SmartContract) UpdateVisibleTo(ctx contractapi.TransactionContextInterface, arg string) (bool, error) {
	InfoLogger.Printf("*************** updateVisibleTo Started ***************")
	InfoLogger.Printf("args received:", arg)

	//getusercontext to populate the required data
	creator, err := ctx.GetStub().GetCreator()
	if err != nil {
		return false, fmt.Errorf("Error getting transaction creator: " + err.Error())
	}
	mspId, commonName, _ := getTxCreatorInfo(creator)
	if mspId != "NgoMSP" {
		InfoLogger.Printf("only ngo can initiate updateVisibleTo")
		return false, fmt.Errorf("only ngo can initiate updateVisibleTo")
	}
	InfoLogger.Printf("current logged in user:", commonName, "with mspId:", mspId)

	var args []string

	err = json.Unmarshal([]byte(arg), &args)
	if err != nil {
		return false, fmt.Errorf(err.Error())
	}

	if len(args) != 4 {
		return false, fmt.Errorf("Incorrect number of arguments. Expecting 4")
	} else if len(args[0]) <= 0 {
		return false, fmt.Errorf("projectId must be a non-empty string")
	} else if len(args[1]) <= 0 {
		return false, fmt.Errorf("corporateName must be a non-empty string")
	} else if len(args[2]) <= 0 {
		return false, fmt.Errorf("date must be a non-empty string")
	} else if len(args[3]) <= 0 {
		return false, fmt.Errorf("txId must be a non-empty string")
	}

	projectId := strings.ToLower(args[0])
	corporateName := strings.ToLower(args[1])
	date, err := strconv.Atoi(args[2])
	if err != nil {
		return false, fmt.Errorf("date should be numeric.")
	}
	txId := args[3]

	//check if the project exists
	projectAsBytes, err := ctx.GetStub().GetState(projectId)
	if err != nil {
		return false, fmt.Errorf("Error getting project")
	}
	if projectAsBytes == nil {
		InfoLogger.Printf("project with id:", projectId, "not present")
		return false, fmt.Errorf("project is not present")
	}
	projectState := Project{}
	json.Unmarshal(projectAsBytes, &projectState)

	//check if caller is the owner of project
	if commonName != projectState.NGO {
		InfoLogger.Printf(commonName, " doesn't owns the project")
		return false, fmt.Errorf("ngo doesn't owns the project")
	}

	if corporateName != "all" {
		if projectState.NoOfUpdates != 0 {
			InfoLogger.Printf("can't update any more!")
			return false, fmt.Errorf("can't update any more!")
		}
		//check if someone has contributed already
		if len(projectState.Contributors) != 0 {
			InfoLogger.Printf("contributors is already set")
			return false, fmt.Errorf("contributors is already set")
		}
		projectState.NoOfUpdates = 1
		var corporateNames []string
		corporateNames = append(corporateNames, corporateName)
		projectState.VisibleTo = corporateNames
	} else {
		if projectState.NoOfUpdates != 1 {
			InfoLogger.Printf("can't update any more!")
			return false, fmt.Errorf("can't update any more!")
		}
		projectState.NoOfUpdates = 2
		projectState.VisibleTo = nil
	}

	projectAsBytes, _ = json.Marshal(projectState)
	ctx.GetStub().PutState(projectId, projectAsBytes)

	//create a transaction
	err = createTransaction(ctx, commonName, "All", 0.0, date, "AddVisibleTo", projectId, txId, -1)
	if err != nil {
		return false, fmt.Errorf("Failed to add a Tx: " + err.Error())
	}

	InfoLogger.Printf("*************** updateVisibleTo Successful ***************")
	return true, nil
}
