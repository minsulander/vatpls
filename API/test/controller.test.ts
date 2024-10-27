import { convertDBResponseToController, validateInputControllerData } from '../src/controllers/controller';
import { Controller } from '../src/types/types';



describe("Add Test Testson controller", () => {
  it("saves controller in database", () => {
    expect(true).toBe(true);
  });
});

describe("Test Testson's state changes to", () => {
  it("pause", () => {
    
  });

  it("position", () => {

  });

  it("other", () => {

  });
});

describe("Adding ", () => {
  it("Add second ", () => {

  });
});


/**
 * INPUT VALIDATION FN TESTS
 */

const badControllerData = {
  Controller: {
    cidq: "123456"
  }
};

const godControllerData = {
  Controller: {
    cid: "1234567"
  }
}

describe("Input validation", () => {
  it("Approves when CID is included in the body", () => {
    expect(validateInputControllerData(godControllerData)).toBe(true);
  });
  it("Failes when cid is not in the body", () => {
    expect(validateInputControllerData(badControllerData)).toBe(false);
  });
  it("returns false when empty body is passed", () => {
    expect(validateInputControllerData({})).toBe(false);
  });
});

/**
 * CONVERT DATABASE RESPONSE FN TEST
 */

const ControllerResult: Controller = {
  name: "Test Testson",
  sign: "TT",
  cid: "1122334",
  rating: "S3",
  callsign: "TEST_TWR",
  frequency: "123.45",
  position: "TEST AD",
  timestamp: Date.UTC(2024, 5, 6, 12).toString()
};

const mockDatabaseResult = {
  cid: "123456"
}

describe("ConvertRespToController", () => {
  it("Correct database response", () => {
    expect(convertDBResponseToController(mockDatabaseResult))
    .toBe(ControllerResult);
  });
  
  it("returns undefined", () => {
    expect(convertDBResponseToController({})).toBe(undefined);
  });
});