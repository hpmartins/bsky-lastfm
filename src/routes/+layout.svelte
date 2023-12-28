<script lang="ts">
    import '../app.css';
</script>

<svelte:head>
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Sofia">
    <title>Musica @ Bluesky</title>
</svelte:head>

<div class="mx-auto max-w-7xl sm:py-4 sm:pt-6 sm:px-6 lg:pt-12 lg:px-12">
    <div class="container bg-gray-400 px-3 sm:px-16 py-4 sm:pt-24 text-center shadow-md sm:rounded-3xl">
        <div class="mx-auto max-w-7xl">
            <div class="text-3xl font-bold text-primary sm:text-4xl">
                <span class="cyclecolor">musica</span>
            </div>
            <p class="mt-4 text-lg leading-6 text-primary text-center">a tool that rovi suggested</p>
        </div>
        <hr class="w-1/2 h-1 mx-auto my-4 bg-secondary border-0 rounded md:my-4" />
        <div class="flex flex-col items-center">
            <slot />
        </div>
    </div>
</div>

<style>
    .cyclecolor {
        -webkit-animation: animate_bg 5s;
        animation: animate_bg 5s;
        -webkit-animation-iteration-count: infinite;
        animation-iteration-count: infinite;
    }

    @keyframes animate_bg {
        0% {
            color: #1d428a;
        }

        50% {
            color: #ffc72c;
        }

        100% {
            color: #1d428a;
        }
    }

    @-webkit-keyframes animate_bg {
        0% {
            color: #1d428a;
        }

        50% {
            color: #ffc72c;
        }

        100% {
            color: #1d428a;
        }
    }
</style>
