import nodemailer from "nodemailer";
import { 
  SecretsManagerClient, 
  GetSecretValueCommand 
} from "@aws-sdk/client-secrets-manager";

export class EmailService {
  private secretId: string;
  private awsRegion: string;
  private client: SecretsManagerClient;

  constructor() {
    this.secretId = process.env.FEEDBACK_SECRET_ID || "KnowYourMLA-feedback-credentials-prod";
    this.awsRegion = process.env.AWS_REGION || "ap-south-2";
    this.client = new SecretsManagerClient({ region: this.awsRegion });
  }

  private async getCredentials() {
    try {
      const response = await this.client.send(
        new GetSecretValueCommand({ SecretId: this.secretId })
      );
      if (response.SecretString) {
        return JSON.parse(response.SecretString);
      }
      return null;
    } catch (error) {
      console.error("Error fetching secret:", error);
      return null;
    }
  }

  async sendFeedback(message: string, url: string): Promise<boolean> {
    const creds = await this.getCredentials();
    if (!creds || !creds.username || !creds.password) {
      console.error("Missing email credentials");
      return false;
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: creds.username,
        pass: creds.password,
      },
    });

    const mailOptions = {
      from: creds.username,
      to: "ptsntamil1@gmail.com",
      subject: "User Feedback from KnowYourMLA",
      text: `
        User Feedback:
        --------------------------------------------------
        ${message}
        --------------------------------------------------
        
        Submitted from URL: ${url}
      `,
    };

    try {
      await transporter.sendMail(mailOptions);
      return true;
    } catch (error) {
      console.error("Error sending email:", error);
      return false;
    }
  }
}
