"# oozmall-mapeditor" 

ozmall-mapeditor - web app плюс бекендовский скрипт app.py как "заглушка" для API.   
Завистит от pyhton 2.7
Для запуска приложения выполните команду:

`python app.py`

и перейдите на http://127.0.0.1:5000

В конце файла `index.html` есть список url entrypoint на которые выполняются запросы.
При встраивании их наверное нужно поменять

```
<script>
    var TENANTS_API_URL = 'tenants/'
    var GRAPH_API_URL = 'graph/'
    var LEVEL1_SVG_URL = 'data/1level.svg'
    var LEVEL2_SVG_URL = 'data/2level.svg'
    var LEVEL3_SVG_URL = 'data/3level.svg'
</script>
```


