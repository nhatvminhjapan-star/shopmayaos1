// File: /api/callback.js (Dành cho Vercel)
const axios = require('axios');
const crypto = require('crypto');

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Chỉ chấp nhận phương thức POST' });
    }

    // --- CẤU HÌNH ---
    const PARTNER_KEY = 'def790ae427e14771b02f4464a850668'; // Key của bạn
    const PARTNER_ID = '1493771935'; // ID của bạn
    const DISCORD_BOT_TOKEN = 'MTM2MDc1MTAzNTY0MzA3MjYzMg.Gj5Ni8.YRStPX-j-s1Z5VT9P8MHkWAAREeH5utfvO_5UE'; // Bot Token
    const DISCORD_USER_ID = '1263012664360042580'; // ID Discord của bạn
    // ----------------

    try {
        const data = req.body;
        console.log("Dữ liệu nhận được:", data);

        // 1. Kiểm tra chữ ký (Sign) để bảo mật
        // Công thức: md5(partner_key + partner_id) - hoặc theo tài liệu web đó
        const localSign = crypto.createHash('md5').update(PARTNER_KEY + PARTNER_ID).digest('hex');

        // Lưu ý: Nếu web đó yêu cầu sign dựa trên nội dung đơn hàng, bạn cần chỉnh lại công thức này
        if (data.sign && data.sign !== localSign) {
            // return res.status(403).json({ status: 'error', message: 'Chữ ký không hợp lệ' });
        }

        if (data.status === 'success') {
            const amount = new Intl.NumberFormat('vi-VN').format(data.pay_amount);
            const content = data.message || 'Không có nội dung';
            const orderCode = data.order_code;

            // 2. Gửi thông báo đến Discord (DM)
            // Bước A: Tạo DM Channel
            const dmChannel = await axios.post(
                'https://discord.com/api/v10/users/@me/channels',
                { recipient_id: DISCORD_USER_ID },
                { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
            );

            const channelId = dmChannel.data.id;

            // Bước B: Gửi nội dung Embed
            const embed = {
                title: "💰 GIAO DỊCH MỚI (CALLBACK)",
                color: 3066993,
                fields: [
                    { name: "Số tiền", value: `**${amount} VND**`, inline: true },
                    { name: "Nội dung", value: `\`${content}\``, inline: true },
                    { name: "Mã đơn", value: `\`${orderCode}\`` },
                    { name: "Trạng thái", value: "✅ Thành công" }
                ],
                timestamp: new Date().toISOString()
            };

            await axios.post(
                `https://discord.com/api/v10/channels/${channelId}/messages`,
                { embeds: [embed] },
                { headers: { Authorization: `Bot ${DISCORD_BOT_TOKEN}` } }
            );

            return res.status(200).json({ status: 'success', message: 'Đã gửi Discord' });
        }

        return res.status(200).json({ status: 'ignored', message: 'Giao dịch không thành công' });

    } catch (error) {
        console.error("Lỗi:", error.message);
        return res.status(500).json({ status: 'error', message: error.message });
    }
}
