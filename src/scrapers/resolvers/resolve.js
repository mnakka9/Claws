const {Openload} = require('./Openload');
const {Streamango} = require('./Streamango');
const RapidVideo = require('./RapidVideo');
const AZMovies = require('./AZMovies');
const Vidlox = require('./Vidlox');
const {VShare} = require('./VShare');
const SpeedVid = require('./SpeedVid');
const VidCloud = require('./VidCloud');
const ClipWatching = require('./ClipWatching');
const EStream = require('./EStream');
// const Vidzi = require('./Vidzi');
const VidTodo = require('./VidTodo');
const {PowVideo} = require('./PowVideo');
const {GamoVideo} = require('./GamoVideo');
const GorillaVid = require('./GorillaVid');
const DaClips = require('./DaClips');
const MovPod = require('./MovPod');
const {Vidoza} = require('./Vidoza');
const StreamM4u = require('./StreamM4u');
const {GoogleDrive, getGoogleDriveScrapeUrl} = require('./GoogleDrive');
const MovieFiles = require('./MovieFiles');
const EnterVideo = require('./EnterVideo');
const DDLResolver = require('./DDLResolver');
const logger = require('../../utils/logger');

const Mp4Upload = require('./Mp4Upload');
const StreamLewd = require('./StreamLewd');
const TikiWiki = require('./TikiWiki');
const FlashX = require('./FlashX');
const KwikCx = require('./KwikCx');
const StreamMoe = require('./StreamMoe');
const VidStreaming = require('./VidStreaming');
const XStreamCDN = require('./XStreamCDN');
const GoGoAnime = require('./GoGoAnime');

const createEvent = require('../../utils/createEvent');
const { rd } = require('../../utils/rd');

/** @type {BaseResolver[]} */
const resolvers = [
    new Mp4Upload(),
    new StreamLewd(),
    new VidStreaming(),
    new TikiWiki(),
    new XStreamCDN(),
    new KwikCx(),
    new StreamMoe(),
    new FlashX(),
    new GoGoAnime()
];

async function resolve(ws, uri, provider, jar, headers, quality = '', meta = { isDDL: false }, hasRD = false) {
    if (ws.stopExecution) {
        logger.debug('Skip resolve due to disconnect');
        return;
    }

    logger.debug(`resolving: ${uri}`);

    const ipLocked = process.env.CLAWS_ENV === 'server';

    try {
        // Loop through all the available providers ordered by priority, the first one to support the uri is used.
        for (let i = 0; i < resolvers.length; i++) {
            let resolver = resolvers[i];
            if (resolver.supportsUri(uri)) {
                logger.debug(`${resolver.getResolverId()} supports ${uri}!`);
                return await resolver.resolveUri({
                    ws,
                    provider,
                    quality,
                    ...meta
                }, uri, jar, headers);
            }
        }
        // TODO move all the resolvers below into their own subclawss for better code maintenance.
        // Same logic should apply to resolveHtml.js.

        let supportedHost = false;
        if (hasRD) {
            supportedHost = rd.isSupportedByRD(uri);
        }
        
        if (supportedHost) {
            const source = rd.getHostName(uri);
            const event = createEvent(uri, ipLocked, null, { quality, source, provider, hasRD });
            await ws.send(event, event.event);
        } else if (uri.includes('openload.co') || uri.includes('oload.cloud')) {
            const path = uri.split('/');
            const videoId = path[4];
            if (!uri.includes('embed')) {
                uri = `https://openload.co/embed/${videoId}`;
            }
            let data;
            if (!ipLocked) {
                data = await Openload(uri, jar, headers);
            }
            const event = createEvent(data, ipLocked, {url: 'https://olpair.com', videoId, target: uri}, {quality, source: 'Openload', provider});
            await ws.send(event, event.event);

        } else if (uri.includes('streamango.com')) {
            let data;
            if (!ipLocked) {
                data = await Streamango(uri, jar, headers);
            }
            const event = createEvent(data, ipLocked, {target: uri}, {quality, source: 'Streamango', provider});
            await ws.send(event, event.event);

        } else if (uri.includes('rapidvideo.com')) {
            const dataList = await RapidVideo(uri, jar);
            if (dataList) {
                for (const data of dataList) {
                    const event = createEvent(data.resolvedLink, false, undefined, {quality: data.quality, source: 'RapidVideo', provider});
                    await ws.send(event, event.event);
                }
            }
        } else if (uri.includes('azmovies.co') || uri.includes('azmovies.ws')) {
            const file = await AZMovies(uri, jar, headers);
            const event = createEvent(file, false, undefined, {quality, source: 'AZMovies', provider});
            await ws.send(event, event.event);

        } else if (uri.includes('vidlox.me') || uri.includes('vidlox.tv')) {
            const dataList = await Vidlox(uri, jar, headers);
            if (dataList) {
                for (const data of dataList) {
                    const event = createEvent(data, false, undefined, {quality, source: 'Vidlox', provider}, {referer: uri});
                    await ws.send(event, event.event);
                }
            }

        } else if (uri.includes('vshare.eu')) {
            const path = uri.split('/');
            let videoId = path[path.length - 1].replace('.html', '');
            if (!uri.includes('embed')) {
                videoId = path[path.length - 1].replace('.htm', '');
                uri = `https://vshare.eu/embed-${videoId}.html`;
            }
            let data;
            if (!ipLocked) {
                data = await VShare(uri, jar, headers);
            }
            const event = createEvent(data, ipLocked, {url: 'https://vshare.eu/pair', videoId, target: uri}, {quality, source: 'VShare', provider});
            await ws.send(event, event.event);

        } else if (uri.includes('speedvid.net')) {
            if (!uri.includes('embed')) {
                const path = uri.split('/');
                const videoId = path[path.length - 1];
                uri = `http://speedvid.net/embed-${videoId}.html`;
            }
            const dataList = await SpeedVid(uri, jar, headers);
            if (dataList) {
                for (const data of dataList) {
                    const event = createEvent(data, false, undefined, {quality, source: 'SpeedVid', provider});
                    await ws.send(event, event.event);
                }
            }

        } else if (uri.includes('vidcloud.co')) {
            if (!uri.includes('player?fid=')) {
                const path = uri.split('/');
                const videoId = path[path.length - 2];
                uri = `https://vidcloud.co/player?fid=${videoId}&page=video`;
            }
            const dataObjects = await VidCloud(uri, jar, headers);
            if (dataObjects) {
                for(dataObject of dataObjects){
                    const event = createEvent(!!dataObject.file ? dataObject.file : dataObject.link, false, undefined, {quality, source: 'VidCloud', provider});
                    await ws.send(event, event.event);
                }
            }

        } else if (uri.includes('clipwatching.com')) {
            const dataObjects = await ClipWatching(uri, jar, headers);
            if (dataObjects) {
                for (const dataObject of dataObjects) {
                    const event = createEvent(dataObject.file, false, undefined, {quality: dataObject.label || quality, source: 'ClipWatching', provider});
                    await ws.send(event, event.event);
                }
            }

        } else if (uri.includes('estream.to') || uri.includes('estream.xyz')) {
            // const path = uri.split('/');
            // const videoId = path[path.length - 1];
            // const videoSourceUrls = await EStream(`http://estream.xyz/embed-${videoId}`, jar, clientIp, userAgent);
            // videoSourceUrls.forEach(source => await ws.send({videoSourceUrl: source, url, provider: 'http://estream.xyz'}, 'result'));
            // // All the links are broken...

        } else if (uri.includes('vidzi.online')) {
            // const sources = await Vidzi(uri, jar, clientIp, userAgent);
            // sources.forEach((source) => await ws.send({videoSourceUrl: source.file, url, provider: 'https://vidzi.online'}, 'result'));
            // // All the links are broken...

        } else if (uri.includes('vidto.me')) {
            // console.log('Skipping vidto.me because the links are always broken.');

        } else if (uri.includes('vidup.me') || uri.includes('vidup.tv') || uri.includes('thevideo.me') || uri.includes('vev.io') || uri.includes('vidup.io')) {
            // console.log('Skipping vidup.me because captcha');

        } else if (uri.includes('vidtodo.me') || uri.includes('vidtodo.com') || uri.includes('vidstodo.me')) {
            const dataObjects = await VidTodo(uri, jar, headers);
            if (dataObjects) {
                for (const dataObject of dataObjects) {
                    const event = createEvent(dataObject.file, false, undefined, {quality: dataObject.label || quality, source: 'VidTodo', provider}, {referer: uri.replace('vidtodo.me', 'vidstodo.me')});
                    await ws.send(event, event.event);
                }
            }

        } else if (uri.includes('powvideo.net')) {
            const path = uri.split('/');
            let videoId = path[path.length - 1].replace('iframe-', '').replace('-954x562.html', '');
            if (!uri.includes('iframe')) {
                videoId = path[path.length - 1];
                uri = `https://povwideo.cc/iframe-${videoId}-954x562.html`;
            }
            let dataObjects = [];
            if (!ipLocked) {
                dataObjects = await PowVideo(uri, jar, headers, videoId);
                if (dataObjects) {
                    for (const dataObject of dataObjects) {
                        const event = createEvent(!!dataObject.file ? dataObject.file : dataObject.link, false, undefined, {quality, source: 'PowVideo', provider});
                        await ws.send(event, event.event);
                    }
                }
            } else {
                const event = createEvent(undefined, true, {target: uri, headers: {referer: `https://povwideo.cc/preview-${videoId}-954x562.html`}}, {quality, source: 'PowVideo', provider});
                await ws.send(event, event.event);
            }

        } else if (uri.includes('streamplay.to')) {
            // console.log('Skipping streamplay.to because captcha.');

        } else if (uri.includes('gamovideo.com')) {
            let dataList = [];
            if (!ipLocked) {
                dataList = await GamoVideo(uri, jar, headers);
                if (dataList) {
                    for (const data of dataList) {
                        const event = createEvent(data, false, undefined, {quality, source: 'GamoVideo', provider});
                        await ws.send(event, event.event);
                    }
                }
            } else {
                const event = createEvent(undefined, true, {target: uri}, {quality, source: 'GamoVideo', provider});
                await ws.send(event, event.event);
            }


        } else if (uri.includes('gorillavid.com') || uri.includes('gorillavid.in')) {
            const dataObjects = await GorillaVid(uri, jar, headers);
            if (dataObjects) {
                for (const dataObject of dataObjects) {
                    const event = createEvent(dataObject.src, false, undefined, {quality, source: 'GorillaVid', provider});
                    await ws.send(event, event.event);
                }
            }

        } else if (uri.includes('daclips.com') || uri.includes('daclips.in')) {
            const dataObjects = await DaClips(uri, jar, headers);
            if (dataObjects) {
                for (const dataObject of dataObjects) {
                    const event = createEvent(dataObject.src, false, undefined, {quality, source: 'DaClips', provider});
                    await ws.send(event, event.event);
                }
            }

        } else if (uri.includes('movpod.com') || uri.includes('movpod.in')) {
            const dataObjects = await MovPod(uri, jar, headers);
            if (dataObjects) {
                for (const dataObject of dataObjects) {
                    const event = createEvent(dataObject.src, false, undefined, {quality, source: 'MovPod', provider});
                    await ws.send(event, event.event);
                }
            }

        } else if (uri.includes('vidoza.net')) {
            if (!uri.includes('embed')) {
                const path = uri.split('/');
                const videoId = path[3].replace('.html', '');
                uri = `https://vidoza.net/embed-${videoId}.html`;
            }
            let dataObjects = [];
            if (!ipLocked) {
                dataObjects = await Vidoza(uri, jar, headers);
                if (dataObjects) {
                    for (const dataObject of dataObjects) {
                        const event = createEvent(dataObject.src, false, undefined, {quality: dataObject.res || quality, source: 'Vidoza', provider});
                        await ws.send(event, event.event);
                    }
                }
            } else {
                const event = createEvent(undefined, true, {target: uri}, {quality, source: 'Vidoza', provider});
                await ws.send(event, event.event);
            }

        } else if (uri.includes('streamm4u.com')) {
            let link = await StreamM4u(uri, jar, headers);
            resolve(ws, link, provider, jar, headers, quality);

        // TODO: Commenting this out until header/cookie support exists for the player.
        } else if (uri.includes('drive.google.com')) {
            uri = getGoogleDriveScrapeUrl(uri);
            let dataObjects = [];
            if (!ipLocked) {
                dataObjects = await GoogleDrive(uri, jar, headers);
                const cookieObjects = jar.getCookies('https://drive.google.com');
                const cookieObject = cookieObjects ? cookieObjects.find(c => c.key === 'DRIVE_STREAM') : {};
                const cookieValue = cookieObject ? cookieObject.value : false;
                const cookie = cookieValue ? `DRIVE_STREAM=${cookieValue}` : undefined;
                if (dataObjects) {
                    for (const dataObject of dataObjects) {
                        const event = createEvent(dataObject.link, false, undefined, {quality: dataObject.quality || quality, source: 'GoogleDrive', provider, cookie});
                        await ws.send(event, event.event);
                    }
                }
            } else {
                const event = createEvent(undefined, true, {target: uri}, {quality, source: 'GoogleDrive', provider, cookieRequired: 'DRIVE_STREAM'});
                await ws.send(event, event.event);
            }

        } else if (uri.includes('moviefiles.org')) {
            const data = await MovieFiles(uri, jar, headers);
            const event = createEvent(data, false, undefined, {quality, source: 'MovieFiles', provider});
            await ws.send(event, event.event);

       /* } else if (uri.includes('entervideo.net')) {
            const data = await EnterVideo(uri, jar, headers);
            const event = createEvent(data, false, undefined, {quality, provider: 'EnterVideo', source});
            sse.send(event, event.event);*/
        } else if (meta.isDDL == true) {
            const data = await DDLResolver(uri, jar, headers);
            const event = createEvent(data.resolvedLink, false, undefined, {quality: data.quality, source: 'DDL', provider, isDDL: true});
            await ws.send(event, event.event);
         } else {
            logger.warn({provider, providerUrl: uri, warning: 'Missing resolver'});
        }
    } catch(err) {
        logger.error({provider, providerUrl: uri, error: (err.message || err.toString()).substring(0, 100) + '...'});
    }
}

module.exports = exports = resolve;
