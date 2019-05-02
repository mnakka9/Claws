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
            const searchUrl = (`${url}/home/search`);
            const rp = this._getRequest(req, ws);
            const jar = rp.jar();
            const response = await this._createRequest(rp, searchUrl, jar, headers,
                {
                    method: 'POST',
                    formData: {
                        searchText: title
                    }
                }, true);

            let $ = cheerio.load(response);

            let contentPage = '';
            $('.video_penal .thumb').toArray().some(element => {
                let linkElement = $(element).find("a");
                let contentLink = `https:${linkElement.attr('href')}`;
                let posterTitle = $(element).attr('title').toLowerCase().trim();

                if (posterTitle == title) {
                    contentPage = contentLink;
                }
            });
            if (!contentPage) {
                return Promise.resolve();
            }

            let contentPageHTML = await this._createRequest(rp, contentPage, jar, headers, {}, true);

            $ = cheerio.load(contentPageHTML);

            let videoPage = '';
            $('.grid-item .panel-body').toArray().forEach(element => {
                const seasonHeader = $(element).find('h3').text().toLowerCase();
                if (seasonHeader == `season ${season}`) {
                    $(element).find('.video_title a').toArray().forEach(episodeLink => {
                        const episodeString = $(episodeLink).attr('title').toLowerCase();
                        if (episodeString.includes(`episode ${episode} `)) {
                            videoPage = `https:${$(episodeLink).attr('href')}`;
                        }
                    });
                }
            });
            if (!videoPage) {
                return Promise.resolve();
            }

            let videoPageHTML = await this._createRequest(rp, videoPage, jar, headers, {}, true);

            $ = cheerio.load(videoPageHTML);

            $('.table.table-striped .tblimg').toArray().forEach(element => {
                const videoLink = $(element).attr('href');
                resolvePromises.push(this.resolveLink(videoLink, ws, jar, headers, '', { isDDL: false}, hasRD));
            });
        } catch (err) {
            this._onErrorOccurred(err);
        }
        return Promise.all(resolvePromises);
    }
}
