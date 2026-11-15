const webpush = require('web-push');

// Настраиваем VAPID для нашего Push-сервера.
webpush.setVapidDetails(
    process.env.VAPID_SUBJECT,
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
);

// Отправляем push-уведомление подписчику.
async function sendPushNotification(
    subscription,
    payload
) {

    try {

        await webpush.sendNotification(
            subscription,
            JSON.stringify(payload)
        );

        console.log(
            '🔔 Push-уведомление отправлено'
        );

    } catch (error) {

    console.error(
        '❌ Ошибка отправки Push:',
        error.message
    );


    // Передаём ошибку дальше,
    // чтобы вызывающий код мог её обработать.
    throw error;
}
}

module.exports = {
    sendPushNotification,
};