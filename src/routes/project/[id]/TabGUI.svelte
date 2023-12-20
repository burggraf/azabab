<ion-content class="ion-padding">

    <div class="container">
        <div class="box upper-left">
            <div class="box-title"><ion-label>Database</ion-label></div>
            <div class="box-content">
                <!-- Scrollable content for upper left box -->
            </div>
        </div>
        <div class="box upper-right">
            <div class="box-title"><ion-label>Hooks</ion-label></div>
            <div class="box-content">
                <!-- Scrollable content for upper right box -->
            </div>
        </div>
        <div class="box lower-left">
            <div class="box-title"><ion-label>Migrations</ion-label></div>
            <div class="box-content">
                <!-- Scrollable content for lower left box -->
            </div>
        </div>
        <div class="box lower-right">
            <div class="box-title"><ion-label>Public</ion-label></div>
            <div class="box-content">
                <!-- Scrollable content for lower right box -->
            </div>
        </div>
    </div>
    

</ion-content>

<style>
html, body {
    height: 100%; /* Full height */
    margin: 0;
    padding: 0;
}

ion-content {
    --padding-start: 0;
    --padding-end: 0;
    --padding-top: 0;
    --padding-bottom: 0;
    height: 100vh; /* Full viewport height */
    display: block; /* Override any flexbox display */
}
.box-title {
    background-color: var(--ion-color-primary);
    color: var(--ion-color-primary-contrast);
    border-bottom: 1px solid black;
    padding-left: 20px;
}

.container {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    height: 100%; /* Full height of ion-content */
    width: 100%; /* Full width */
}

.box {
    border: 1px solid black;
    display: flex;
    flex-direction: column; /* Align children vertically */
    justify-content: flex-start; /* Start content from the top */
    overflow: hidden; /* Hide overflow */
    min-height: 50vh; /* Minimum half viewport height */
    height: 50vh; /* Set height to half of the viewport height */
    position: relative; /* Needed for absolute positioning of children */
}

.box-content {
    width: 100%; /* Full width of the box */
    height: 100%; /* Full height of the box */
    overflow-y: auto; /* Enable vertical scrolling */
    position: absolute; /* Positioned absolutely to fill the box */
    top: 0;
    left: 0;
    margin-top: 20px;
    margin-left: 20px;
    padding-right: 20px;
}

.upper-left .mylist {
    width: 100%;
    height: 100%;
    overflow-y: auto;
}

</style>