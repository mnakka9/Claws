const BaseResolver = require('./_BaseResolver');
const cheerio = require('cheerio');

module.exports = class GoGoAnime extends BaseResolver {

    /** @inheritdoc */
    supportsUri(uri) {
        return uri.includes('gogoanime.to');
    }

    /** @inheritdoc */
    resolveHtml(meta, html, jar, headers) {
        let $ = cheerio.load(html);

        const urlRegex = /var video_links = {.+}/g;
        const urlMatches = $.html().match(urlRegex);
        if (urlMatches && urlMatches.length > 0) {
            const urlMatch = urlMatches[0];
            const jsonString = urlMatch.split(' = ')[1];

            const json = JSON.parse(jsonString);

            let links = [];
            for (var quality in json) {
                for (var idx in json[quality]) {
                    links.push({
                        data: json[quality][idx][0]['link'],
                        meta: {
                            quality: ''
                        }
                    });
                }
            }

            return this.processHtmlResults(meta, links);
        }
    }
};