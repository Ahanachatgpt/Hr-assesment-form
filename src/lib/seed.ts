import bcrypt from "bcryptjs";
import { AssessmentForm, Submission, Database, FormField } from "./types";
import { field, uid } from "./utils";

const BLOOD = [
  "A positive (A+)",
  "A negative (A-)",
  "B positive (B+)",
  "B negative (B-)",
  "AB positive (AB+)",
  "AB negative (AB-)",
  "O positive (O+)",
  "O negative (O-)",
  "Unknown",
];

export function defaultHrForm(): AssessmentForm {
  const now = new Date().toISOString();

  const eduExam = field({ type: "text", label: "Examination / Degree", required: true, width: "half" });
  const eduSchool = field({ type: "text", label: "School / College", required: true, width: "half" });
  const eduStart = field({ type: "date", label: "Start Date", required: false, width: "third", hideDay: true });
  const eduEnd = field({ type: "date", label: "End Date", required: false, width: "third", hideDay: true });
  const eduMarks = field({ type: "text", label: "Marks obtained in %", placeholder: "e.g. 90.4", width: "third" });

  const empOrg = field({ type: "text", label: "Organisation Name", width: "half" });
  const empDesig = field({ type: "text", label: "Designation", width: "half" });
  const empStart = field({ type: "date", label: "Start Date", required: true, width: "third", hideDay: true });
  const empEnd = field({ type: "date", label: "End Date", required: true, width: "third", hideDay: true });
  const empSalary = field({ type: "text", label: "Monthly Salary", width: "third" });
  const empReason = field({ type: "text", label: "Resignation Reason", width: "full" });

  const trName = field({ type: "text", label: "Name", width: "half" });
  const trCourse = field({ type: "text", label: "Course", width: "half" });
  const trBoard = field({ type: "text", label: "Board / Society", width: "half" });
  const trLoc = field({ type: "text", label: "Location / Conducted by", width: "half" });
  const trDate = field({ type: "text", label: "MM/YY", placeholder: "06/2024", width: "third" });

  const refName = field({ type: "text", label: "Name", width: "half" });
  const refAddr = field({ type: "text", label: "Address", width: "half" });
  const refPhone = field({ type: "tel", label: "Contact No", width: "half" });
  const refRel = field({ type: "text", label: "Relationship", width: "half" });

  const famRel = field({
    type: "select",
    label: "Relation",
    width: "half",
    options: ["Father", "Mother", "Spouse", "Children", "Brother/Sister", "Guardian"],
  });
  const famName = field({ type: "text", label: "Name", width: "half" });
  const famAge = field({ type: "text", label: "Age", width: "half" });
  const famOcc = field({ type: "text", label: "Occupation", width: "half" });

  const education: FormField = {
    ...field({
      type: "repeater",
      label: "Education Details",
      helpText: "Enter SSLC, HSC, UG, PG and any other qualifications.",
      required: true,
    }),
    repeaterFields: [eduExam, eduSchool, eduStart, eduEnd, eduMarks],
    defaultRows: [
      { [eduExam.id]: "SSLC" },
      { [eduExam.id]: "HSC" },
      { [eduExam.id]: "" },
      { [eduExam.id]: "" },
    ],
  };

  const family: FormField = {
    ...field({
      type: "repeater",
      label: "Family Details",
    }),
    repeaterFields: [famRel, famName, famAge, famOcc],
    defaultRows: [
      { [famRel.id]: "Father" },
      { [famRel.id]: "Mother" },
      { [famRel.id]: "Spouse" },
      { [famRel.id]: "Children" },
      { [famRel.id]: "Brother/Sister" },
      { [famRel.id]: "Guardian" },
    ],
  };

  return {
    id: "form_hr_assessment",
    title: "Interview Assessment Form",
    slug: "hr-assessment",
    description: "Candidate registration and interview assessment for Ahana Hospitals.",
    instructions:
      "Complete every section, upload your photo and resume, then submit. Your form is converted to PDF and sent to HR with the resume attached.",
    department: "Human Resources",
    status: "published",
    notifyEmail: "",
    createdAt: now,
    updatedAt: now,
    fields: [
      field({ type: "section", label: "Candidate details" }),
      field({
        type: "file",
        label: "Image Upload",
        helpText: "Passport-size photograph (JPG or PNG).",
        required: true,
        width: "half",
        accept: ".jpg,.jpeg,.png,image/*",
      }),
      field({
        type: "text",
        label: "Position applied for",
        placeholder: "e.g. Staff Nurse",
        required: true,
        width: "half",
      }),
      field({ type: "text", label: "Name As Per Aadhar", placeholder: "Full name as per Aadhar", required: true, width: "half" }),
      field({ type: "date", label: "Date of Birth", required: true, width: "half" }),
      field({ type: "select", label: "Blood group", required: true, width: "half", options: BLOOD }),
      field({ type: "tel", label: "Mobile Number", required: true, width: "half" }),
      field({ type: "tel", label: "Mobile Number (In case of Emergency)", required: true, width: "half" }),
      field({ type: "email", label: "Email", required: true, width: "half" }),
      field({
        type: "select",
        label: "Gender",
        required: true,
        width: "half",
        options: ["Female", "Male", "Other"],
      }),
      field({
        type: "select",
        label: "Religion",
        width: "half",
        options: ["Hindu", "Muslim", "Christian", "Sikh", "Buddhist", "Jain", "Other"],
      }),
      field({ type: "text", label: "AADHAR", placeholder: "12-digit Aadhaar number", width: "half" }),
      field({
        type: "select",
        label: "Marital Status",
        width: "half",
        options: ["Single", "Married", "Widowed", "Divorced"],
      }),
      field({ type: "text", label: "PAN No", placeholder: "e.g. ABCDE1234F", width: "half" }),
      field({ type: "text", label: "Passport No", placeholder: "e.g. J1234567", width: "half" }),
      field({
        type: "textarea",
        label: "Address",
        placeholder: "House / street, post, city, state, PIN, country",
        required: true,
      }),

      education,

      {
        ...field({
          type: "repeater",
          label: "Employment Details",
          helpText: "Select Yes if you have work experience, or No if you are a fresher.",
        }),
        repeaterFields: [empOrg, empDesig, empStart, empEnd, empSalary, empReason],
      },
      field({
        type: "textarea",
        label: "Last/Present Organization roles & responsibilities",
      }),
      field({
        type: "textarea",
        label: "Please explain the reason of interest in working with Ahana Hospitals",
        required: true,
      }),

      {
        ...field({ type: "repeater", label: "Training & Certifications" }),
        repeaterFields: [trName, trCourse, trBoard, trLoc, trDate],
      },

      {
        ...field({ type: "repeater", label: "References" }),
        repeaterFields: [refName, refAddr, refPhone, refRel],
        defaultRows: [{}, {}],
      },

      family,

      field({ type: "section", label: "Additional information" }),
      field({ type: "text", label: "Salary Expected", placeholder: "10000 Per Month", required: true, width: "half" }),
      field({
        type: "select",
        label: "How did you come to know about this vacancy?",
        required: true,
        width: "half",
        options: ["Job portal", "Employee referral", "Walk-in", "Company website", "Social media", "Campus", "Other"],
        followUpExcept: ["Walk-in", "Company website"],
        followUpLabel: "Note / details",
        followUpPlaceholder: "e.g. portal name, employee name, campus, or other details",
      }),
      field({
        type: "yesno",
        label: "Have you recently attended any interviews or are you currently attending any?",
        width: "half",
      }),
      field({
        type: "select",
        label: "How many days would you require to Join?",
        required: true,
        width: "half",
        options: ["Immediately", "7 days", "15 days", "30 days", "45 days", "60 days", "90 days"],
      }),
      field({
        type: "yesno",
        label: "Are you presently taking medication for any illness or disease?",
        width: "half",
      }),
      field({
        type: "yesno",
        label: "Do you possess vehicle for attending office?",
        width: "half",
      }),
      field({ type: "yesno", label: "Do you smoke?", width: "half" }),
      field({
        type: "yesno",
        label: "Have you been interviewed by us before",
        width: "half",
      }),
      field({
        type: "yesno",
        label: "Are you covered under ESI?",
        width: "half",
        followUpWhen: "Yes",
        followUpLabel: "ESI number",
        followUpPlaceholder: "e.g. 123456789012",
      }),
      field({
        type: "yesno",
        label: "Are you covered under PF?",
        width: "half",
        followUpWhen: "Yes",
        followUpLabel: "PF / UAN number",
        followUpPlaceholder: "e.g. 100123456789",
      }),
      field({ type: "text", label: "Submitters Location", placeholder: "City / town", width: "half" }),
      field({
        type: "file",
        label: "Upload your Resume",
        helpText: "PDF, Word, HTML, RTF, TXT or image. Max 10 MB.",
        required: true,
        accept: ".pdf,.doc,.docx,.html,.htm,.rtf,.txt,.odt,.jpg,.jpeg,.png",
      }),
      field({
        type: "file",
        label: "Upload your Experience / Course certificates",
        helpText: "You can attach more than one file. Experience certificate, course completed certificate, or any other supporting document. PDF, Word, HTML, RTF, TXT or image. Max 10 MB each.",
        multiple: true,
        accept: ".pdf,.doc,.docx,.html,.htm,.rtf,.txt,.odt,.jpg,.jpeg,.png",
      }),
      field({
        type: "checkbox",
        label: "Terms and Conditions",
        required: true,
        options: [
          "I hereby declare that all the statements made in my candidature and the attached job application form are true, complete and correct to the best of my knowledge and belief. In the event of any information being found false or incorrect at any stage, my candidature is liable to be rejected and if already appointed, my services are liable to be terminated without notice.",
        ],
      }),
    ],
  };
}

export function internForm(): AssessmentForm {
  const now = new Date().toISOString();
  return {
    id: "form_internship",
    title: "Internship Application Form",
    slug: "internship",
    description: "Apply for an internship. Attach your resume and academic details.",
    instructions: "This form is for students and fresh graduates seeking internship opportunities.",
    department: "Human Resources",
    status: "published",
    notifyEmail: "",
    createdAt: now,
    updatedAt: now,
    fields: [
      field({ type: "section", label: "Applicant details" }),
      field({ type: "text", label: "Name", required: true, width: "half" }),
      field({ type: "email", label: "Email", required: true, width: "half" }),
      field({ type: "tel", label: "Mobile Number", required: true, width: "half" }),
      field({
        type: "select",
        label: "Internship domain",
        required: true,
        width: "half",
        options: ["Nursing", "HR", "Pharmacy", "Lab", "Administration", "Other"],
      }),
      field({ type: "text", label: "College / University", required: true, width: "half" }),
      field({ type: "text", label: "Degree & year", placeholder: "B.Sc Nursing, Final year", required: true, width: "half" }),
      field({ type: "date", label: "Available from", width: "half" }),
      field({
        type: "select",
        label: "Duration",
        width: "half",
        options: ["1 month", "2 months", "3 months", "6 months"],
      }),
      field({ type: "textarea", label: "Why this internship?", required: true }),
      field({
        type: "file",
        label: "Upload your Resume",
        required: true,
        accept: ".pdf,.doc,.docx,.html,.htm,.rtf,.txt,.odt",
      }),
      field({
        type: "checkbox",
        label: "Terms and Conditions",
        required: true,
        options: ["I confirm that the details provided are accurate."],
      }),
    ],
  };
}

function pick(fieldList: AssessmentForm["fields"], label: string) {
  return fieldList.find((f) => f.label === label)?.id;
}

export function demoSubmissions(forms: AssessmentForm[]): Submission[] {
  const hr = forms.find((f) => f.slug === "hr-assessment")!;
  const intern = forms.find((f) => f.slug === "internship")!;
  const daysAgo = (n: number) => new Date(Date.now() - n * 86400000).toISOString();

  const answers: Record<string, unknown> = {
    [pick(hr.fields, "Position applied for")!]: "Staff Nurse",
    [pick(hr.fields, "Name As Per Aadhar")!]: "Asin Thangaraj",
    [pick(hr.fields, "Date of Birth")!]: "2002-09-08",
    [pick(hr.fields, "Blood group")!]: "B positive (B+)",
    [pick(hr.fields, "Mobile Number")!]: "+917871837653",
    [pick(hr.fields, "Mobile Number (In case of Emergency)")!]: "+919487918245",
    [pick(hr.fields, "Email")!]: "asinthangaraj3@gmail.com",
    [pick(hr.fields, "Gender")!]: "Female",
    [pick(hr.fields, "Religion")!]: "Hindu",
    [pick(hr.fields, "AADHAR")!]: "616473385055",
    [pick(hr.fields, "Marital Status")!]: "Single",
    [pick(hr.fields, "Address")!]:
      "2/82, Periya illiyam, pothiyapalayam post, Kangayam, Tamil Nadu, 638701, India",
    [pick(hr.fields, "Please explain the reason of interest in working with Ahana Hospitals")!]:
      "I would like to work as a mental health nurse, and I am willing to develop myself and learn every day for the betterment of the patients and the hospital.",
    [pick(hr.fields, "Salary Expected")!]: "20,000 per month",
    [pick(hr.fields, "How did you come to know about this vacancy?")!]: "Job portal",
    [pick(hr.fields, "Have you recently attended any interviews or are you currently attending any?")!]: "No",
    [pick(hr.fields, "How many days would you require to Join?")!]: "Immediately",
    [pick(hr.fields, "Are you presently taking medication for any illness or disease?")!]: "No",
    [pick(hr.fields, "Do you possess vehicle for attending office?")!]: "No",
    [pick(hr.fields, "Do you smoke?")!]: "No",
    [pick(hr.fields, "Have you been interviewed by us before")!]: "No",
  };

  const edu = hr.fields.find((f) => f.label === "Education Details" && f.type === "repeater");
  if (edu?.repeaterFields) {
    const [exam, school, start, end, marks] = edu.repeaterFields;
    answers[edu.id] = [
      {
        [exam.id]: "SSLC / 10",
        [school.id]: "Mercy matriculation higher secondary school",
        [start.id]: "June 2017",
        [end.id]: "March 2018",
        [marks.id]: "90.4",
      },
      {
        [exam.id]: "HSC / 12",
        [school.id]: "Mercy matriculation higher secondary school",
        [start.id]: "June 2019",
        [end.id]: "March 2020",
        [marks.id]: "72.5",
      },
      {
        [exam.id]: "UG — B.Sc Nursing",
        [school.id]: "Bishop's College of Nursing",
        [start.id]: "",
        [end.id]: "",
        [marks.id]: "",
      },
    ];
  }

  const fam = hr.fields.find((f) => f.label === "Family Details");
  if (fam?.repeaterFields) {
    const [rel, name, age, occ] = fam.repeaterFields;
    answers[fam.id] = [
      { [rel.id]: "Father", [name.id]: "Thangaraj", [age.id]: "52", [occ.id]: "Coolie" },
      { [rel.id]: "Mother", [name.id]: "Jothimani", [age.id]: "46", [occ.id]: "Homemaker" },
    ];
  }

  return [
    {
      id: uid("sub"),
      formId: hr.id,
      formTitle: hr.title,
      formSlug: hr.slug,
      candidateName: "Asin Thangaraj",
      candidateEmail: "asinthangaraj3@gmail.com",
      candidatePhone: "+917871837653",
      answers,
      resumeName: "Asin_T_BSc_Nursing_Resume.pdf",
      emailStatus: "not_configured",
      createdAt: daysAgo(0.1),
    },
    {
      id: uid("sub"),
      formId: intern.id,
      formTitle: intern.title,
      formSlug: intern.slug,
      candidateName: "Rahul Iyer",
      candidateEmail: "rahul.iyer@college.edu",
      candidatePhone: "9000011122",
      answers: {
        [pick(intern.fields, "Name")!]: "Rahul Iyer",
        [pick(intern.fields, "Email")!]: "rahul.iyer@college.edu",
        [pick(intern.fields, "Mobile Number")!]: "9000011122",
      },
      resumeName: "Rahul_Iyer_Resume.pdf",
      emailStatus: "not_configured",
      createdAt: daysAgo(2),
    },
  ];
}

export async function createInitialDatabase(): Promise<Database> {
  const forms = [defaultHrForm(), internForm()];
  return {
    settings: {
      companyName: "Ahana Hospitals & Research Center",
      companyTagline: "Interview assessment & candidate registration",
      supportEmail: "hr@ahanahospitals.com",
      notifyEmail: "hr@ahanahospitals.com",
      smtpHost: "",
      smtpPort: 587,
      smtpUser: "",
      smtpPass: "",
      smtpSecure: false,
      smtpFromName: "Ahana Hospitals HR",
      smtpFromEmail: "noreply@ahanahospitals.com",
    },
    admin: {
      username: "admin",
      passwordHash: await bcrypt.hash("admin123", 10),
    },
    forms,
    submissions: demoSubmissions(forms),
  };
}
