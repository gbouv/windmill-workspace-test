package inner

import (
	"fmt"
  "time"
)

func main(sleep_sec int) (interface{}, error) {
	fmt.Println("Hello, Cozy script!")
  time.Sleep(time.Duration(sleep_sec) * time.Second)
	return "This is cozy", nil
}
