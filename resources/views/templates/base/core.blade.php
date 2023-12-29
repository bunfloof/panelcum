@extends('templates/wrapper', [
    'css' => ['body' => 'bun-theme-light'],
])

@section('container')
    <div id="modal-portal"></div>
    <div id="app"></div>
@endsection

<script>
    document.addEventListener('DOMContentLoaded', function () {
        var theme = localStorage.getItem('theme') || 'bun-theme-pterodactyl'; // Default to 'light' if no theme is set
        // List of all possible theme classes
        var allThemeClasses = ['bun-theme-light', 'bun-theme-pterodactyl', 'bun-theme-dragon'];
        // Remove all theme classes first
        allThemeClasses.forEach(function(cls) {
            document.body.classList.remove(cls);
        });
        // Then add the current theme class
        document.body.classList.add(`bun-theme-${theme}`);
    });
</script>