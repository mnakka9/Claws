const BaseProvider = require('../BaseProvider');
const Utils = require('../../../utils/index');

module.exports = class Reddit extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://www.reddit.com/user/nbatman/m/streaming2/search.json'];
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

            const json = JSON.parse(response);
            const children = json.data.children;
            for (let child of children) {
                const link = child.data.url;
                const quality = Utils.getQualityInfo(child.data.title);
                resolvePromises.push(this.resolveLink(link, ws, jar, headers, quality, { isDDL: false }, hasRD));
            }
        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
