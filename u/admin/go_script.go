package inner

import (
	"fmt"
	"errors"
)

func main(x string) (interface{}, error) {
	fmt.Printf("Hellow %s\n", x)
	return x, errors.New("failing")
}
