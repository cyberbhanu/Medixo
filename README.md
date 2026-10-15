# Medixo
a website for patient appointment booking

## Browser push notifications

Set `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, and `VAPID_SUBJECT` in the backend environment to enable appointment push notifications. Generate a VAPID key pair from the backend directory with:

```sh
node -e "console.log(require('web-push').generateVAPIDKeys())"
```

Push alerts are available in supported desktop and mobile browsers over HTTPS (or localhost). On iPhone and iPad, add Medixo to the Home Screen, open the installed app, then enable alerts from the dashboard. Patients, doctors, laboratories, and staff assigned to the appointment's doctor or facility receive notifications relevant to their role.
