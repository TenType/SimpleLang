# SimpleLang
An experimental and deliberately minimal programming language

> **Please note:** This program was written when I had zero experience with lexing and parsing. If you want to see what a proper programming language looks like, please check out my other repositories!

## Prerequisites
You must have [Node.js](https://nodejs.org/) installed on your device.

## Example
Install the required dependencies by running `npm install`, then run `npm start` and paste in the following:
```
/* comments are useful */

print Hello world!\n\n;

/* for loop 5 times */
num i 0;

@begin;
if {i} > 4;
    goto @endfor;
elif {i} == 2;
    print i = 2, yay!\n;
else;
    print i = {i}, loops are cool!\n;
endif;
add {i} 1;
num i {cache};

goto @begin;

@endfor;
print done with loop;
```
Then, enter a new line and run the code by exiting the command line (^C).