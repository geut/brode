import { test } from 'zora'

test('should result to the answer', t => {
  const answer = 42
  t.equal(answer, 43, 'answer should be 42')
})
