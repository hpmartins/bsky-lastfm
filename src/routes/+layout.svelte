<script lang="ts">
    import '../app.css';
</script>

<svelte:head>
    <title>Musica @ Bluesky</title>
</svelte:head>

<div class="mx-auto max-w-7xl py-4 sm:pt-14 sm:px-6 lg:px-8">
    <div class="container bg-gray-400 px-3 sm:px-16 py-4 sm:pt-24 text-center shadow-md sm:rounded-3xl">
        <div class="mx-auto max-w-7xl">
            <div class="text-3xl font-bold text-primary sm:text-4xl">
                musica <span class="cyclecolor">@</span> bluesky
            </div>
            <p class="mt-4 text-lg leading-6 text-primary text-center">a tool that rovi suggested</p>
        </div>
        <div class="flex flex-col items-center">
            <slot />
        </div>
    </div>
</div>

<style>
    @keyframes changeColor {
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

    .cyclecolor {
        animation: changeColor ease;
        animation-iteration-count: infinite;
        animation-duration: 2s;
        animation-fill-mode: both;
    }
</style>
