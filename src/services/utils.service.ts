// import { modalController } from '$app/navigation';
// import { showConfirm } from '$services/alert.service';
import { modalController } from '$ionic/svelte'

export const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const gen_random_uuid = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    var r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}
export const uuid_generate_v4 = gen_random_uuid;

export const openModal = async (theModal: any, theProps: any = {}, theOptions: any = {}) => {
  const obj: any = {
    component: theModal,
    componentProps: theProps,
    showBackdrop: true,
    backdropDismiss: true,
  };
  for (const key in theOptions) {
    obj[key] = theOptions[key];
  }
  console.log('obj', obj)
  const openLoginModalController = await modalController.create(obj)

  openLoginModalController.present();
  setTimeout(() => {resizeModal(openLoginModalController)}, 200);
  const { data } = await openLoginModalController.onWillDismiss();
  return data;
}

export const resizeModal = async (openLoginModalController: HTMLIonModalElement) => {
  setTimeout(() => {
    const pg = openLoginModalController.getElementsByClassName('ion-page')[0];
    const header = pg.getElementsByTagName('ion-header')[0];
    const content = pg.getElementsByTagName('ion-content')[0];
    const footer = pg.getElementsByTagName('ion-footer')[0];
    let p = pg.clientHeight;
    if (header) p -= header.clientHeight;
    if (footer) p -= footer.clientHeight;
    content.style.height = p + 'px';
  }, 200);
}

export const isModal = async () => {
  return (await modalController.getTop() !== undefined);
}

