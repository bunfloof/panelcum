@extends('templates/wrapper', [
    'css' => ['body' => 'bun-theme-light'],
])

@section('container')
    <div id="modal-portal"></div>
    <div id="app"></div>
@endsection

<style>
.bun-theme-light .text-neutral-200 {
    @apply text-zinc-900;
}
</style>

<script>
    document.addEventListener('DOMContentLoaded', function () {
        var theme = localStorage.getItem('theme') || 'bun-theme-light';
        var allThemeClasses = ['bun-theme-light', 'bun-theme-dark', 'bun-theme-pterodactyl', 'bun-theme-dragon'];
        allThemeClasses.forEach(function(cls) {
            document.body.classList.remove(cls);
        });
        document.body.classList.add(`bun-theme-${theme}`);

        updateTextColor();
    });

    function updateTextColor() {
        // Check if the light theme is active
        if (document.body.classList.contains('bun-theme-light')) {
            var elements = document.querySelectorAll('.text-neutral-200');
            elements.forEach(function(el) {
                el.classList.remove('text-neutral-200');
                el.classList.add('text-zinc-900');
            });
        }
    }
</script>
