class Helpers {
    static formatPhoneNumber(phone) {
        let cleaned = phone.toString().replace(/[^0-9]/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '255' + cleaned.substring(1);
        }
        if (!cleaned.startsWith('255') && !cleaned.startsWith('1') && !cleaned.startsWith('44')) {
            cleaned = '255' + cleaned;
        }
        return cleaned;
    }

    static generateSessionId() {
        return `crush_ray_${Date.now()}_${Math.random().toString(36).substring(7)}`;
    }

    static formatDate(date) {
        return date.toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    static sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static maskPhoneNumber(phone) {
        if (!phone) return 'Unknown';
        const str = phone.toString();
        if (str.length <= 6) return str;
        return str.slice(0, 4) + '****' + str.slice(-3);
    }
}

module.exports = Helpers;
