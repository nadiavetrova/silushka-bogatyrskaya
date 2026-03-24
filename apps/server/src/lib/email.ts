import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY);

export function generateVerificationCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(
  to: string,
  code: string,
  name: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0d0d0d;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:480px;margin:0 auto;padding:40px 20px;">
    <div style="background:linear-gradient(135deg,#1a1208 0%,#2a1f0f 50%,#1a1208 100%);border:2px solid #7a5c35;border-radius:16px;padding:32px;text-align:center;">

      <h1 style="color:#a83232;font-size:22px;letter-spacing:2px;margin:0 0 4px;">
        СИЛУШКА БОГАТЫРСКАЯ
      </h1>
      <div style="height:1px;background:linear-gradient(to right,transparent,#7a5c35,transparent);margin:16px 0;"></div>

      <p style="color:#d4bc8e;font-size:18px;margin:16px 0 8px;">
        Здрав будь, ${name || "Богатырь"}!
      </p>
      <p style="color:#9b7a4a;font-size:14px;margin:0 0 24px;">
        Подтверди свою грамоту, дабы вступить в ряды богатырей
      </p>

      <div style="background:#151412;border:2px solid #7a5c35;border-radius:12px;padding:20px;margin:0 auto 24px;max-width:240px;">
        <p style="color:#9b7a4a;font-size:11px;margin:0 0 8px;letter-spacing:1px;">ТВОЙ ТАЙНЫЙ КОД</p>
        <p style="color:#d4bc8e;font-size:36px;font-weight:bold;letter-spacing:8px;margin:0;">${code}</p>
      </div>

      <p style="color:#9b7a4a;font-size:12px;margin:0;">
        Код действует 10 минут
      </p>

      <div style="height:1px;background:linear-gradient(to right,transparent,#7a5c35,transparent);margin:24px 0 16px;"></div>
      <p style="color:#7a5c35;font-size:10px;margin:0;">
        silushka-bogatyrskaya.com
      </p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: "Силушка Богатырская <noreply@silushka-bogatyrskaya.com>",
    to,
    subject: `${code} — Твой код подтверждения`,
    html,
  });
}

export async function sendPasswordResetEmail(
  to: string,
  code: string,
  name: string
): Promise<void> {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background-color:#0d0d0d;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:480px;margin:0 auto;padding:40px 20px;">
    <div style="background:linear-gradient(135deg,#1a1208 0%,#2a1f0f 50%,#1a1208 100%);border:2px solid #7a5c35;border-radius:16px;padding:32px;text-align:center;">

      <h1 style="color:#a83232;font-size:22px;letter-spacing:2px;margin:0 0 4px;">
        СИЛУШКА БОГАТЫРСКАЯ
      </h1>
      <div style="height:1px;background:linear-gradient(to right,transparent,#7a5c35,transparent);margin:16px 0;"></div>

      <p style="color:#d4bc8e;font-size:18px;margin:16px 0 8px;">
        ${name || "Богатырь"}, не отчаивайся!
      </p>
      <p style="color:#9b7a4a;font-size:14px;margin:0 0 24px;">
        Введи сей код, дабы восстановить доступ к своей грамоте
      </p>

      <div style="background:#151412;border:2px solid #7a5c35;border-radius:12px;padding:20px;margin:0 auto 24px;max-width:240px;">
        <p style="color:#9b7a4a;font-size:11px;margin:0 0 8px;letter-spacing:1px;">КОД ВОССТАНОВЛЕНИЯ</p>
        <p style="color:#d4bc8e;font-size:36px;font-weight:bold;letter-spacing:8px;margin:0;">${code}</p>
      </div>

      <p style="color:#9b7a4a;font-size:12px;margin:0;">
        Код действует 10 минут
      </p>
      <p style="color:#7a5c35;font-size:11px;margin:8px 0 0;">
        Если ты не запрашивал восстановление — просто проигнорируй это письмо
      </p>

      <div style="height:1px;background:linear-gradient(to right,transparent,#7a5c35,transparent);margin:24px 0 16px;"></div>
      <p style="color:#7a5c35;font-size:10px;margin:0;">
        silushka-bogatyrskaya.com
      </p>
    </div>
  </div>
</body>
</html>`;

  await resend.emails.send({
    from: "Силушка Богатырская <noreply@silushka-bogatyrskaya.com>",
    to,
    subject: `${code} — Восстановление доступа`,
    html,
  });
}
