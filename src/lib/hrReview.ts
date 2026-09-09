import { HrReview } from "./types";

export function emptyHrReview(): HrReview {
  return {
    hrRatings: [
      { criterion: "Personality", rating: "", remarks: "" },
      { criterion: "Physical fitness", rating: "", remarks: "" },
      { criterion: "Communication Skills", rating: "", remarks: "" },
      { criterion: "Attitude", rating: "", remarks: "" },
    ],
    functionalHead: "",
    hrSignature: "",
    hodRatings: [
      { criterion: "Subject knowledge", rating: "", remarks: "" },
      { criterion: "Relevant work experience", rating: "", remarks: "" },
      { criterion: "Achievements", rating: "", remarks: "" },
      { criterion: "Initiatives", rating: "", remarks: "" },
    ],
    hodSignature: "",
    designation: "",
    location: "",
    dateOfJoining: "",
    salary: "",
    probationPeriod: "",
    reviewDate: "",
    managementRemarks: "",
    managementApproval: "",
  };
}
