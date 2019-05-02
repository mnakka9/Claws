const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class ToonGet extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ["http://www.toonget.net"];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const season = req.query.season;
        const episode = req.query.episode;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};

        try {
            let searchUrl = `${url}/${title.replace(' ', '-')}-season-${season}-episode-${episode}`;
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            $('#streams iframe').toArray().forEach(element => {
                const videoLink = $(element).attr('src');
                resolvePromises.push(this.resolveLink(videoLink, ws, jar, headers, '', { isDDL: false}, hasRD));
            });
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }
}
