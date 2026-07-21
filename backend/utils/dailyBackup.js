const fs = require("fs/promises");
const path = require("path");

const User = require("../models/User");
const Doctor = require("../models/Doctor");
const Appointment = require("../models/Appointment");

const DEFAULT_BACKUP_TIME = "23:59";
const DEFAULT_BACKUP_DIR = path.join(__dirname, "..", "backups");

const parseBackupTime = (timeString) => {
  const match = /^(\d{2}):(\d{2})$/.exec(timeString || "");

  if (!match) {
    return { hours: 23, minutes: 59 };
  }

  const hours = Number(match[1]);
  const minutes = Number(match[2]);

  if (hours > 23 || minutes > 59) {
    return { hours: 23, minutes: 59 };
  }

  return { hours, minutes };
};

const getTimestampParts = (date = new Date()) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  const seconds = String(date.getSeconds()).padStart(2, "0");

  return {
    dateStamp: `${year}-${month}-${day}`,
    timeStamp: `${hours}-${minutes}-${seconds}`,
    isoString: date.toISOString(),
  };
};

const getNextRunDelay = (timeString) => {
  const now = new Date();
  const { hours, minutes } = parseBackupTime(timeString);
  const nextRun = new Date(now);

  nextRun.setHours(hours, minutes, 0, 0);

  if (nextRun <= now) {
    nextRun.setDate(nextRun.getDate() + 1);
  }

  return nextRun.getTime() - now.getTime();
};

const createBackupSnapshot = async () => {
  const [users, doctors, appointments] = await Promise.all([
    User.find().select("+password").lean(),
    Doctor.find().lean(),
    Appointment.find().lean(),
  ]);

  return {
    users,
    doctors,
    appointments,
  };
};

const writeBackupFile = async () => {
  const backupDir = process.env.BACKUP_DIR || DEFAULT_BACKUP_DIR;
  const timestamp = getTimestampParts();
  const dayDirectory = path.join(backupDir, timestamp.dateStamp);
  const filePath = path.join(dayDirectory, `backup-${timestamp.timeStamp}.json`);
  const snapshot = await createBackupSnapshot();

  await fs.mkdir(dayDirectory, { recursive: true });
  await fs.writeFile(
    filePath,
    JSON.stringify(
      {
        createdAt: timestamp.isoString,
        counts: {
          users: snapshot.users.length,
          doctors: snapshot.doctors.length,
          appointments: snapshot.appointments.length,
        },
        data: snapshot,
      },
      null,
      2
    ),
    "utf8"
  );

  console.log(`Daily backup saved: ${filePath}`);
};

const scheduleDailyBackup = () => {
  const backupTime = process.env.BACKUP_TIME || DEFAULT_BACKUP_TIME;
  const delay = getNextRunDelay(backupTime);

  console.log(`Daily backup scheduler active for ${backupTime} local server time`);

  setTimeout(async () => {
    try {
      await writeBackupFile();
    } catch (error) {
      console.error("Daily backup failed:", error.message);
    }

    scheduleDailyBackup();
  }, delay);
};

const startDailyBackupService = async () => {
  try {
    await writeBackupFile();
  } catch (error) {
    console.error("Initial backup failed:", error.message);
  }

  scheduleDailyBackup();
};

module.exports = {
  startDailyBackupService,
};
