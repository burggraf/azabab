<script lang="ts">
	import IonPage from "$ionpage";
    import { pb } from '$services/backend.service';
	import { onMount } from "svelte"
    import type { Question } from './quiz.interfaces'
    import { initQuestion } from "./quiz.interfaces";
    import { currentUser } from '$services/backend.service';
    let question: Question = initQuestion();
    let correct: number = 0;
    let total: number = 0;
    const getQuestion = async () => {
        const result = await pb.send("/getquestion", {});
        question = result.result as Question; 
        question.answerMap = ['a', 'b', 'c', 'd'].sort(() => Math.random() - 0.5);
    }
    onMount(async () => {
        await getQuestion();
    });
    const ionViewDidEnter = async () => {
        // await getScore();
    }
    const getScore = async () => {
        if (!$currentUser) {
            return;
        }
        try {
            const record = await pb.collection('trivia_log_score').getFirstListItem(`id="${$currentUser.id}"`, {});
            if (record) {
                correct = record.correct;
                total = record.total;
            }
        } catch (error) {
            // no data, probably
        }
    }
    currentUser.subscribe(async (user: any) => {
        if (user?.id === $currentUser?.id && total > 0) {
            return; // no need to keep loading the score when this fires multiple times
        }
        if (user) {
            await getScore();
        }
    });
    const logQuestion = async (letter: string) => {
        if (!$currentUser) {
            return;
        }
        pb.collection('trivia_log').create({
            question: question.id,
            chosen: letter,
            correct: (letter === 'a'),
            user: $currentUser.id,
        });
    }
    const selectAnswer = (letter: string) => {
        // get position of this letter in the answerMap
        const index = question.answerMap.indexOf(letter);
        const chosenEl: any = document.getElementById(`item-${index}`);
        return () => {
            if (letter === 'a') {
                if (chosenEl) {
                    chosenEl.color = 'success';
                    chosenEl.fill = 'outline';
                }
                correct++;
            } else {
                if (chosenEl) {
                    chosenEl.color = 'danger';
                }
                const correctEl: any = document.getElementById(`item-${question.answerMap.indexOf('a')}`);
                if (correctEl) {
                    correctEl.color = 'success';
                    correctEl.fill = 'outline';
                }
            }
            total++;
            logQuestion(letter);
            setTimeout(() => {
                for (let i = 0; i < 4; i++) {
                    const el: any = document.getElementById(`item-${i}`);
                    if (el) {
                        el.color = '';
                        el.fill = 'clear';
                    }
                }
                getQuestion();
            }, 2000)
        }
    }
</script>
<IonPage {ionViewDidEnter}>
    <ion-header>
        <ion-toolbar>
            <ion-buttons slot="start">
                <ion-menu-button />
            </ion-buttons>
            <ion-title>Quiz</ion-title>
        </ion-toolbar>
    </ion-header>
    <ion-content class="ion-padding">

        {#if question.id}
        <ion-card>
            <ion-card-header>
              <ion-card-title>{question.category}</ion-card-title>
              <ion-card-subtitle>{question.subcategory}</ion-card-subtitle>
            </ion-card-header>
          
            <ion-card-content>
                {question.question}
            </ion-card-content>
          
            <div class="ion-padding">
            <ion-button class="item-text-wrap" id="item-0" fill="clear" on:click={selectAnswer(question.answerMap[0])}>{question[question.answerMap[0]]}</ion-button>
            <ion-button class="item-text-wrap" id="item-1" fill="clear" on:click={selectAnswer(question.answerMap[1])}>{question[question.answerMap[1]]}</ion-button>
            <ion-button class="item-text-wrap" id="item-2" fill="clear" on:click={selectAnswer(question.answerMap[2])}>{question[question.answerMap[2]]}</ion-button>
            <ion-button class="item-text-wrap" id="item-3" fill="clear" on:click={selectAnswer(question.answerMap[3])}>{question[question.answerMap[3]]}</ion-button>
            </div>
        </ion-card>
        {:else}
        <ion-card>
            <ion-card-header>
              <ion-card-title>Loading question...</ion-card-title>
            </ion-card-header>
            <ion-card-subtitle style="padding-left: 30px;">monkeys returning to typewriters in 1...2...</ion-card-subtitle>
             
                <ion-card-content class="ion-text-center">
                 <ion-spinner />
                </ion-card-content>
        </ion-card>
        {/if}

    </ion-content>
    <ion-footer>
        <ion-toolbar>
            <!-- <ion-buttons slot="start">
                <ion-menu-button />
            </ion-buttons> -->
            {#if total > 0}
            <ion-title>{correct} of {total} ({Math.round(correct / Math.max(1, total) * 100)}%)</ion-title>
            {/if}
        </ion-toolbar>
    </ion-footer>
</IonPage>
<style>
  ion-spinner {
    width: 100px;
    height: 100px;
  }    
</style>