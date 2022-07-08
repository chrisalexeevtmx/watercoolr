export function shuffle(array) {
    let currentIndex = array.length
    let randomIndex;

    // While there remain elements to shuffle.
    while (currentIndex !== 0) {

        // Pick a remaining element.
        randomIndex = Math.floor(Math.random() * currentIndex);
        currentIndex--;

        // And swap it with the current element.
        [array[currentIndex], array[randomIndex]] = [
        array[randomIndex], array[currentIndex]];
    }

    return array;
}
  
export function pairUp(array) {
    const groups = []
    const half = Math.ceil(array.length / 2)
    const firstHalf = array.slice(0, half)
    const secondHalf = array.slice(half, array.length)
    const third = firstHalf.length > secondHalf.length ? firstHalf.pop() : null

    for (let i = 0; i < firstHalf.length; i++) {
        groups.push([firstHalf[i], secondHalf[i]])
    }

    if (third)
        groups[groups.length - 1].push(third)

    return groups
}

export function formatName(name) {
    const nameArr = name.split(',')
    for (let i = 0; i < nameArr.length; i++) {
        const trimmed = nameArr[i].trim()
        nameArr[i] = trimmed;
    }
    return `${nameArr[1]} ${nameArr[0]}`
}