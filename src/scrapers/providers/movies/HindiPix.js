const cheerio = require('cheerio');
const BaseProvider = require('../BaseProvider');

module.exports = class HindiPix extends BaseProvider {
    /** @inheritdoc */
    getUrls() {
        return ['https://hindipix.in'];
    }

    /** @inheritdoc */
    async scrape(url, req, ws) {
        const title = req.query.title.toLowerCase();
        const hasRD = req.query.hasRD;
        const resolvePromises = [];
        let headers = {};

        try {
            const searchTitle = `${title}`;
            let searchUrl = (`${url}/search?search=${searchTitle.replace(/ /g, '+')}`);
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers);

            let $ = cheerio.load(response);

            let videoPage = '';
            $(`div[class='img__wrap']`).toArray().forEach(element => {
                let linkElement = $(element).find("a");

                let contentTitle = linkElement.find('h5').text().toLowerCase();
                let contentPage = linkElement.attr('href');

                if (contentTitle.split(" ")[0] === title) {
                    if (contentPage.includes('..')) contentPage = `${url}${contentPage.replace('..', '')}`;
                    videoPage = contentPage;
                }
            });

            if (!videoPage) {
                return Promise.resolve();
            }

            const videoPageHTML = await this._createRequest(rp, videoPage, jar, headers);

            $ = cheerio.load(videoPageHTML);

            let video2Page = $("iframe[id='toChange']").attr('src');

            const video2PageHTML = await this._createRequest(rp, video2Page, jar, headers);

            $ = cheerio.load(video2PageHTML);

            let openloadPage = $("iframe").attr('src');

            if (!openloadPage.includes("openload")) {
                this.logger.debug("Hindipix not able to resolve OpenLoad.");
                return false;
            }
            const openloadHTML = await this._createRequest(rp, openloadPage);

            let openloadURL = cheerio.load(openloadHTML)('meta[name="og:url"]').attr('content');
            if (openloadURL) {
                resolvePromises.push(this.resolveLink(openloadURL, ws, jar, headers, '', { isDDL: false }, hasRD));
            } else {
                return Promise.resolve();
            }

        } catch (err) {
            this._onErrorOccurred(err)
        }
        return Promise.all(resolvePromises)
    }
}
