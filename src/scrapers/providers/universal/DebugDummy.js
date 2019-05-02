const BaseProvider = require('../BaseProvider');

module.exports = class DebugDummy extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return [''];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        const debugLinks = [
            // Hardcoded Links
        ];
        for (const debugLink of debugLinks) {
            resolvePromises.push(this.resolveLink(debugLink, ws, null, null, '', { isDDL: false}, hasRD));
        }
        return Promise.all(resolvePromises)
    }
}