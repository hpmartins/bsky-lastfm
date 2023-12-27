<script lang="ts">
    import { onMount } from 'svelte';
    import type { CirclesOptionsType, IQuery } from '$lib/types';

    let canvas: HTMLCanvasElement;
    let context: CanvasRenderingContext2D | null;
    let circlesImage: HTMLImageElement;

    export let query: IQuery;
    export let options: CirclesOptionsType; // all options

    let list: {
        name: string;
        image: string;
    }[] = [];

    if (query.data?.type === 'lastfm') {
        list = query.data.list.map((x) => ({
            name: x.name,
            image: x.spotifyImage ? x.spotifyImage : x.image[1]['#text'],
        }));
    }

    if (query.data?.type === 'spotify') {
        list = query.data.list.map((x) => ({
            name: x.name,
            image: x.images[2].url
        }));
    }

    function hex_is_light(color: string) {
        const hex = color.replace('#', '');
        const c_r = parseInt(hex.substring(0, 0 + 2), 16);
        const c_g = parseInt(hex.substring(2, 2 + 2), 16);
        const c_b = parseInt(hex.substring(4, 4 + 2), 16);
        const brightness = (c_r * 299 + c_g * 587 + c_b * 114) / 1000;
        return brightness > 155;
    }

    const numberOfRows = 2;
    const perRow = 5;

    const globalBorder = 10;
    const imageBorder = 3;
    const imageFooter = 0;
    const footerHeight = 0;

    const headerHeight = 25 + globalBorder;
    const logoSize = headerHeight - globalBorder;
    const width = 600;
    const height = headerHeight + footerHeight + (width / perRow + imageFooter) * numberOfRows;

    const fullWidth = width + 2*globalBorder;
    const fullHeight = height + 2*globalBorder;

    const images = list.slice(0, numberOfRows * perRow);

    let headerLogo: string;
    let headerText: string;
    if (query.data?.type === 'lastfm') {
        headerLogo = '/lastfm.svg';
        headerText = `Top ${numberOfRows*perRow} artistas dos últimos 7 dias`;
    } else if (query.data?.type === 'spotify') {
        headerLogo = '/spotify.svg';
        headerText = `Top ${numberOfRows*perRow} artistas dos últimos 30 dias`;
    }

    // this runs every time the Circles component is remounted,
    // which happens every time any of the inputs change
    onMount(() => {
        context = canvas.getContext('2d');

        if (!context) return;
        if (!list || !options) return;
        if (!list || list.length === 0) return;

        const textColor = hex_is_light(options.bg_color) ? '#000000' : '#CCCCCC';

        context.fillStyle = options.bg_color;
        context.fillRect(0, 0, fullWidth, fullHeight);

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'medium';

        context.font = '16px Arial';
        context.fillStyle = textColor;

        context.textBaseline = 'middle';
        context.textAlign = 'left';
        context.fillText(headerText, globalBorder + imageBorder + 1.20*logoSize , globalBorder + imageBorder + logoSize/2);

        if (options.add_border) {
            context.strokeStyle = options.border_color;
            context.lineWidth = 10;
            context.beginPath();
            context.roundRect(0, 0, fullWidth, fullHeight, 10);
            context.stroke();
        }
        const promises = [];

        promises.push(new Promise((resolve, reject) => {
            const img = new Image();
                img.setAttribute('crossOrigin', 'anonymous');
                img.src = headerLogo
                img.onload = function () {
                    if (!context) return reject;
                    context.save();
                    context.drawImage(img, globalBorder + imageBorder, globalBorder + imageBorder, logoSize, logoSize);
                    context.restore();
                    resolve(img);
                };
        }));

        const preload = (data: { image: string }, opt: { [key: string]: number }) =>
            new Promise((resolve, reject) => {
                const img = new Image();
                img.setAttribute('crossOrigin', 'anonymous');
                if (data.image.startsWith('/')) {
                    img.src = data.image;
                } else {
                    img.src = data.image;
                }
                img.onload = function () {
                    if (!context) return reject;
                    context.save();
                    context.beginPath();
                    context.roundRect(opt.centerX + imageBorder, opt.centerY + imageBorder + headerHeight, opt.size, opt.size, 10);
                    context.clip();
                    context.drawImage(img, opt.centerX + imageBorder, opt.centerY + imageBorder + headerHeight, opt.size, opt.size);
                    context.restore();
                    resolve(img);
                };
            });

        for (let row = 0; row < images.length; row += perRow) {
            const chunk = images.slice(row, row + perRow);
            for (let i = 0; i < perRow; i++) {
                promises.push(
                    preload(
                        { image: chunk[i].image },
                        {
                            centerX: (width / perRow) * i + globalBorder,
                            centerY: (width / perRow + imageFooter) * (row / perRow) + globalBorder,
                            size: width / perRow - 2 * imageBorder
                        }
                    )
                );
            }
        }

        Promise.allSettled(promises).then(() => {
            circlesImage.src = canvas.toDataURL();
        });
    });
</script>

<canvas hidden bind:this={canvas} width={fullWidth} height={fullHeight} />
<img bind:this={circlesImage} alt="" />
