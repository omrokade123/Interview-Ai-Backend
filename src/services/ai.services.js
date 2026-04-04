
const OpenAI = require("openai");
const puppeteer  = require("puppeteer");




const client = new OpenAI({
  apiKey: process.env.FIREWORKS_API_KEY,
  baseURL: "https://api.fireworks.ai/inference/v1",
});




const interviewReportJsonSchema = {
  type: "object",
  required: [
    "title",
    "matchScore",
    "technicalQuestions",
    "behavioralQuestions",
    "skillGaps",
    "preparationPlan"
  ],
  properties: {
    title: {
      type: "string"
    },

    matchScore: {
      type: "number",
      minimum: 0,
      maximum: 100
    },

    technicalQuestions: {
      type: "array",
      minItems: 5,
      items: {
        type: "object",
        required: ["question", "intention", "answer"],
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" }
        }
      }
    },

    behavioralQuestions: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        required: ["question", "intention", "answer"],
        properties: {
          question: { type: "string" },
          intention: { type: "string" },
          answer: { type: "string" }
        }
      }
    },

    skillGaps: {
      type: "array",
      minItems: 3,
      items: {
        type: "object",
        required: ["skill", "severity"],
        properties: {
          skill: { type: "string" },
          severity: {
            type: "string",
            enum: ["low", "medium", "high"]
          }
        }
      }
    },

    preparationPlan: {
      type: "array",
      minItems: 5,
      items: {
        type: "object",
        required: ["day", "focus", "tasks"],
        properties: {
          day: {
            type: "integer",
            minimum: 1
          },
          focus: { type: "string" },
          tasks: {
            type: "array",
            minItems: 2,
            items: {
              type: "string"
            }
          }
        }
      }
    }
  }
};




async function generateInterviewReport({ resume, selfDescription, jobDescription }) {


  const prompt = `You are a strict JSON generator.

            Generate EXACTLY ONE interview report object based on the given Resume, Self Description, and Job Description.

            ⚠️ STRICT RULES (MUST FOLLOW):
            - Return ONLY a valid JSON object
            - DO NOT return an array
            - DO NOT include explanations or extra text
            - DO NOT rename fields
            - DO NOT skip any field
            - DO NOT add extra fields
            - DO NOT stringify objects inside arrays

            ----------------------------------

            📌 REQUIRED JSON STRUCTURE:

            {
            "title": string,
            "matchScore": number,

            "technicalQuestions": [
                {
                "question": string,
                "intention": string,
                "answer": string
                }
            ],

            "behavioralQuestions": [
                {
                "question": string,
                "intention": string,
                "answer": string
                }
            ],

            "skillGaps": [
                {
                "skill": string,
                "severity": "low" | "medium" | "high"
                }
            ],

            "preparationPlan": [
                {
                "day": number,
                "focus": string,
                "tasks": [string]
                }
            ]
            }

            ----------------------------------

            📌 REQUIREMENTS:

            - "title" must match the job role
            - "matchScore" must be between 0 and 100
            - Generate at least:
            - 5 technicalQuestions
            - 3 behavioralQuestions
            - 3 skillGaps
            - 5 preparationPlan days

            ----------------------------------

            📌 IMPORTANT FORMAT RULES:

            ❌ WRONG:
            "technicalQuestions": ["{...}", "{...}"]

            ❌ WRONG:
            "skillGaps": ["React", "Node"]

            ❌ WRONG:
            "technicalQuestions": undefined

            ❌ WRONG:
            Returning array: [ {...} ]

            ✅ CORRECT:
            "technicalQuestions": [
            {
                "question": "...",
                "intention": "...",
                "answer": "..."
            }
            ]

            ----------------------------------

            📌 INPUT DATA:

            Resume:
            ${resume}

            Self Description:
            ${selfDescription}

            Job Description:
            ${jobDescription}

    `;

  const response = await client.chat.completions.create({
    model: "accounts/fireworks/models/gpt-oss-20b",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "InterviewReport",
        schema: interviewReportJsonSchema
      }
    },
    temperature: 0.2
  });


  return JSON.parse(response.choices[0].message.content);


}

async function generatePdfFromHtml(htmlContent) {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.setContent(htmlContent, { waitUntil: "networkidle0" })

  const pdfBuffer = await page.pdf({
    format: "A4", margin: {
      top: "20mm",
      bottom: "20mm",
      left: "15mm",
      right: "15mm"
    }
  })

  await browser.close()

  return pdfBuffer
}

async function generateResumePdf({ resume, selfDescription, jobDescription }) {

  const resumePdfJsonSchema = {
    type: "object",
    required: ["html"],
    properties: {
      html: {
        type: "string"
      }
    }
  };

  const prompt = `Generate resume for a candidate with the following details:
                        Resume: ${resume}
                        Self Description: ${selfDescription}
                        Job Description: ${jobDescription}

                        the response should be a JSON object with a single field "html" which contains the HTML content of the resume which can be converted to PDF using any library like puppeteer.
                        The resume should be tailored for the given job description and should highlight the candidate's strengths and relevant experience. The HTML content should be well-formatted and structured, making it easy to read and visually appealing.
                        The content of resume should be not sound like it's generated by AI and should be as close as possible to a real human-written resume.
                        you can highlight the content using some colors or different font styles but the overall design should be simple and professional.
                        The content should be ATS friendly, i.e. it should be easily parsable by ATS systems without losing important information.
                        The resume should not be so lengthy, it should ideally be 1-2 pages long when converted to PDF. Focus on quality rather than quantity and make sure to include all the relevant information that can increase the candidate's chances of getting an interview call for the given job description.
                    `

  const response = await client.chat.completions.create({
    model: "accounts/fireworks/models/gpt-oss-20b",
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "ResumePDF",
        schema: resumePdfJsonSchema
      }
    },
  })


  const jsonContent = JSON.parse(response.choices[0].message.content);

  const pdfBuffer = await generatePdfFromHtml(jsonContent.html)

  return pdfBuffer

}

module.exports = { generateInterviewReport, generateResumePdf };