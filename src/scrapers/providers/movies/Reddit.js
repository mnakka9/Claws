const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');
const Utils = require('../../../utils/index');

module.exports = class Reddit extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www.reddit.com/user/nbatman/m/streaming2/search'];
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
            let searchUrl = this._generateUrl(url, { q: searchTitle, restrict_sr: 'on' });
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            $('.search-result').toArray().forEach(element => {
                const resultHeader = $(element).find('.search-result-header a').text();
                const quality = Utils.getQualityInfo(resultHeader);
                const link = $(element).find('.search-result-footer a').attr('href');
                resolvePromises.push(this.resolveLink(link, ws, jar, headers, quality, { isDDL: false }, hasRD));
            });
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
