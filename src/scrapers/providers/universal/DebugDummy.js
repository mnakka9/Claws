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
            'http://play44net.gogoanime.to/new/?w=745&h=450&vid=at/nw/at_adventure_time_season_10_-_11.mp4',
            'http://play44net.gogoanime.to/embed.php?w=745&h=450&vid=at/nw/at_ben_10_2016_3_-_01.mp4'
        ];
        for (const debugLink of debugLinks) {
            resolvePromises.push(this.resolveLink(debugLink, ws, null, null, '', { isDDL: false}, hasRD));
        }
        return Promise.all(resolvePromises)
    }
}