<script lang="ts">
    import { onMount } from 'svelte';
    import dayjs from 'dayjs';
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
            image: x.image[1]['#text'],
        }));
    }

    if (query.data?.type === 'spotify') {
        list = query.data.list.map((x) => ({
            name: x.name,
            image: x.images[2].url,
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
    const toRad = (x: number) => x * (Math.PI / 180);

    // this runs every time the Circles component is remounted,
    // which happens every time any of the inputs change
    onMount(() => {
        context = canvas.getContext('2d');

        if (!context) return;
        if (!list || !options) return;

        if (!list || list.length === 0) return;

        const distances: { [key: number]: number[] } = {
            1: [0, 210, 0, 0],
            2: [0, 158, 246, 0],
            3: [0, 120, 196, 260]
        };

        const radiuses: { [key: number]: number[] } = {
            1: [125, 55, 0, 0],
            2: [95, 42, 32, 0],
            3: [75, 32, 28, 22]
        };

        let center: string;
        if (query.data?.type === 'lastfm') {
            center = '/lastfm.svg';
        } else if (query.data?.type === 'spotify') {
            center = '/spotify.svg';
        } else return;

        let config = [
            { distance: 0, count: 1, radius: radiuses[options.orbits][0], images: [center] },
            {
                distance: distances[options.orbits][1],
                count: 5,
                radius: radiuses[options.orbits][1],
                images: list.slice(0, 5).map((x) => x.image)
            },
            {
                distance: distances[options.orbits][2],
                count: 8,
                radius: radiuses[options.orbits][2],
                images: list.slice(5, 13).map((x) => x.image)
            },
            {
                distance: distances[options.orbits][3],
                count: 12,
                radius: radiuses[options.orbits][3],
                images: list.slice(13, 25).map((x) => x.image)
            }
        ];
        config = config.slice(0, options.orbits + 1);

        const width = 600;
        const height = 600;
        const textColor = hex_is_light(options.bg_color) ? '#000000' : '#CCCCCC';

        context.fillStyle = options.bg_color;
        context.fillRect(0, 0, width, height);

        context.imageSmoothingEnabled = true;
        context.imageSmoothingQuality = 'medium';

        // if (options.add_date) {
        //     const type = data?.date?.type ?? '';
        //     let textFull = '';
        //     if (type === 'weekly') {
        //         const textFrom = data?.date?.start?.toDate().toLocaleDateString();
        //         const textTo = data?.date?.end?.toDate().toLocaleDateString();
        //         textFull = `${textFrom} - ${textTo}`;
        //     } else if (type === 'all') {
        //         textFull = `${new Date().toLocaleDateString()} (all time)`;
        //     } else if (type === 'month') {
        //         textFull = `${new Date().toLocaleDateString()} (month)`;
        //     } else if (type === 'week') {
        //         const textFrom = dayjs().subtract(1, 'week').toDate().toLocaleDateString();
        //         const textTo = new Date().toLocaleDateString();
        //         textFull = `${textFrom} - ${textTo}`;
        //     } else if (type === 'day') {
        //         const textFrom = dayjs().subtract(24, 'hour').toDate().toLocaleDateString();
        //         const textTo = new Date().toLocaleDateString();
        //         textFull = `${textFrom} - ${textTo}`;
        //     }
        //     context.font = '20px Arial';
        //     context.fillStyle = textColor;
        //     context.fillText(textFull, 12, 28);
        // }

        if (options.add_watermark) {
            context.font = '20px Arial';
            context.fillStyle = textColor;
            context.textAlign = 'right';
            context.fillText('musica.raios.xyz', 588, 28);
        }

        if (options.add_border) {
            context.strokeStyle = options.border_color;
            context.lineWidth = 15;
            context.beginPath();
            context.roundRect(0, 0, width, height, 15);
            context.stroke();
        }

        const promises = [];

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
                    context.arc(opt.centerX, opt.centerY, opt.radius, 0, 2 * Math.PI, false);
                    context.clip();
                    context.drawImage(
                        img,
                        opt.centerX - opt.radius,
                        opt.centerY - opt.radius,
                        opt.radius * 2,
                        opt.radius * 2
                    );
                    context.restore();
                    resolve(img);
                };
            });

        for (const [orbitIndex, orbit] of config.entries()) {
            const { count, radius, distance, images } = orbit;

            const angleSize = 360 / count;
            for (let i = 0; i < count; i++) {
                if (!images[i]) break;

                const offset = orbitIndex * -90;
                const t = toRad(i * angleSize + offset);

                promises.push(
                    preload(
                        { image: images[i] },
                        {
                            centerX: Math.cos(t) * distance + width / 2,
                            centerY: Math.sin(t) * distance + height / 2,
                            radius: radius
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

<canvas hidden bind:this={canvas} width={600} height={600} />
<img bind:this={circlesImage} alt="" />
