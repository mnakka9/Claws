const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class Putlocker extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://putlockerr.is', 'https://putlockers.movie'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const imdb_id = req.query.imdb_id;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};

        try {
            let searchUrl = `${url}/embed/${imdb_id}/`;
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            $('iframe').toArray().forEach(element => {
                const link = $(element).attr('src');
                resolvePromises.push(this.resolveLink(link, ws, jar, headers, '', { isDDL: false }, hasRD));
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
