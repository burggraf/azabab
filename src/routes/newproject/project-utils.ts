import type { Project } from '../instance/[id]/interfaces';
import { pb } from '$services/backend.service';
export const checkDomainAvailability = async (project: Project) => {
    const domain = project.domain
    let retval = false
    if (!domain) {
        return retval;
    }
    try {
        const record = await pb.collection('projects').getFirstListItem(`domain="${domain}"`, {
            fields: 'domain',
        });
        retval = false;
    } catch (error: any) {
        if (error?.response?.message === "The requested resource wasn't found.") {
            retval = true;
        } else {
            retval = false;
        }
    }
    return retval;
}
