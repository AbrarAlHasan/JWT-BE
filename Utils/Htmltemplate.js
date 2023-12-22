import { formatDateTimeTimezone } from "./FormatDateTime.js";

export const taskCreatedTemplate = (details) => {
  return `
    <!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>New Task Assignment</title>
        <style>
        body {
            font-family: Arial, sans-serif;
        }
        .container {
            padding: 20px;
            border: 1px solid #e0e0e0;
            border-radius: 5px;
            background-color: #f9f9f9;
        }
        .highlight {
            font-weight: bold;
            color: #333;
        }
        .green-text {
            color: green;
        }
        .red-text {
            color: red;
        }
        </style>
    </head>
    <body>
    
    <div class="container">
        <h2>New Task Assignment</h2>
        <p>
            A new task has been assigned to you in the Project <span class="highlight">${
              details.projectDetails.name
            }</span>.
        </p>
        <p>
            <strong>Start Date:</strong> <span class="highlight green-text">${formatDateTimeTimezone(
              details.taskDetails.startDate
            )}</span>
        </p>
        <p>
            <strong>End Date:</strong> <span class="highlight red-text">${formatDateTimeTimezone(
              details.taskDetails.endDate
            )}</span>
        </p>
        <p>
            Please plan your time accordingly. If you encounter any issues or have questions, kindly contact <a href="mailto:${
              details.userDetails.email
            }" class="highlight">${details.userDetails.email}</a>.
        </p>
    </div>
    
    </body>
    </html>
    `;
};
export const taskDueDateRemainderTemplate = (dueForDay) => {
  let htmlContent = `<!DOCTYPE html>
    <html lang="en">
    <head>
        <meta charset="UTF-8">
        <title>Due Tasks</title>
        <style>
            body {
                font-family: 'Arial', sans-serif;
                background-color: #f4f4f4;
                margin: 0;
                padding: 0;
            }
            .container {
                max-width: 900px;
                margin: 50px auto;
                background-color: #ffffff;
                padding: 30px;
                border-radius: 8px;
                box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
            }
            .card {
                border-radius: 8px;
                border: 1px solid #e0e0e0;
                margin-bottom: 20px;
                padding: 20px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            .highlight {
                font-weight: bold;
                color: #333;
            }
            .green-text {
                color: green;
            }
            .red-text {
                color: red;
            }
            h1 {
                text-align: center;
                margin-bottom: 30px;
                color: #333;
            }
            .email-link {
                color: blue;
                text-decoration: underline;
                cursor: pointer;
            }
        </style>
    </head>
    <body>
    <div class="container">
        <h1>Due Tasks List</h1>
    `;

  dueForDay.tasks.forEach((task) => {
    const projectDetails = task.projectDetails;
    const createdByDetails = task.createdBy;

    htmlContent += `
      <div class="card">
          <div>
              <strong>Task Name:</strong> <span class="highlight">${
                task.name
              }</span><br>
              <strong>Start Date:</strong> <span class="highlight green-text">${formatDateTimeTimezone(
                task.startDate
              )}</span><br>
              <strong>End Date:</strong> <span class="highlight red-text">${formatDateTimeTimezone(
                task.endDate
              )}</span>
          </div>
          <div>
              <strong>Project Name:</strong> <span class="highlight">${
                projectDetails.name
              }</span><br>
              <strong>Created By:</strong> <a href="mailto:${
                createdByDetails.email
              }" class="highlight email-link">${createdByDetails.email}</a>
          </div>
      </div>
      `;
  });

  htmlContent += `
      </div>
    </body>
    </html>
    `;

  return htmlContent;
};
