//go:build linux

package internal

type PowerControl struct {
}

func (s *PowerControl) Inc() {

}

func (s *PowerControl) Dec() {

}

func GetPowerControl() *PowerControl {
	powerControl := &PowerControl{}
	return powerControl
}
