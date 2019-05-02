const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class OpenloadMovie extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://openloadmovie.org'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const year = req.query.year;
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};

        try {
            const searchTitle = `${title} ${year}`;
            let searchUrl = `${url}/movies/${searchTitle.replace(/\s/g, '-')}/`;
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            $('.metaframe').toArray().forEach(element => {
                const link = $(element).attr('data-lazy-src');
                resolvePromises.push(this.resolveLink(link, ws, jar, headers, '', { isDDL: false }, hasRD));
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
